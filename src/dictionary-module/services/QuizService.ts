import { In, LessThan, Not, Repository } from "typeorm";
import db from "../../data-source";
import {
    Dictionary,
    DictionaryWord,
    MaterialLevel,
    Question,
    Quiz,
    TextTemplate,
    QuizAnswer,
    QuizAttempt,
    UserMaterialLevel,
} from "../../entities";
import { QuestionType } from "../../entities/Question.entity";
import { UserMaterialStatus } from "../../entities/enums";

export class QuizService {
    private readonly QUIZ_SHORT_LENGTH = 6;
    private readonly QUIZ_LENGTH = 14;

    private readonly dictionaryWordRepo: Repository<DictionaryWord>;
    private readonly quizRepo: Repository<Quiz>;
    private readonly questionRepo: Repository<Question>;
    private readonly textTemplateRepo: Repository<TextTemplate>;
    private readonly materialLevelRepo: Repository<MaterialLevel>;
    private readonly quizAnswerRepo: Repository<QuizAnswer>;
    private readonly quizAttemptRepo: Repository<QuizAttempt>;
    private readonly userMaterialLevelRepo: Repository<UserMaterialLevel>;

    private textTemplatesCache: Record<QuestionType, TextTemplate[]>;

    constructor(
        private readonly dictionary: Dictionary,
        private readonly materialLevelId: string | null = null
    ) {
        this.dictionaryWordRepo = db.getRepository(DictionaryWord);
        this.questionRepo = db.getRepository(Question);
        this.quizRepo = db.getRepository(Quiz);
        this.textTemplateRepo = db.getRepository(TextTemplate);
        this.materialLevelRepo = db.getRepository(MaterialLevel);
        this.quizAnswerRepo = db.getRepository(QuizAnswer);
        this.quizAttemptRepo = db.getRepository(QuizAttempt);
        this.userMaterialLevelRepo = db.getRepository(UserMaterialLevel);
        this.textTemplatesCache = {
            [QuestionType.SourceToTargetTranslate]: [],
            [QuestionType.TargetToSourceTranslate]: [],
            [QuestionType.SourceToTargetInput]: [],
        };
    }

    generate = async () => {
        const words = await this.getSourceWords();
        const length = this.getQuizLength();

        if (words.length < length) {
            throw new Error(
                "Not enough words in the dictionary to generate a quiz"
            );
        }

        const S2T_INPUT = Math.floor(length * 0.2);
        const S2T_TRANSLATE = Math.ceil((length - S2T_INPUT) / 2);
        const T2S_TRANSLATE = length - S2T_INPUT - S2T_TRANSLATE;

        const name = await this.getTitle();
        const quiz = this.quizRepo.create({
            dictionary: this.dictionary,
            title: name,
        });
        await this.quizRepo.save(quiz);

        const questions: Question[] = [];

        let wordIndex = 0;

        for (let i = 0; i < S2T_TRANSLATE; i++) {
            const question = this.questionRepo.create({
                quiz,
                type: QuestionType.SourceToTargetTranslate,
                textTemplate: await this.getTextTemplate(
                    QuestionType.SourceToTargetTranslate
                ),
                dictionaryWord: words[wordIndex],
            });
            questions.push(question);
            wordIndex++;
        }

        for (let i = 0; i < T2S_TRANSLATE; i++) {
            const question = this.questionRepo.create({
                quiz,
                type: QuestionType.TargetToSourceTranslate,
                textTemplate: await this.getTextTemplate(
                    QuestionType.TargetToSourceTranslate
                ),
                dictionaryWord: words[wordIndex],
            });
            questions.push(question);
            wordIndex++;
        }

        for (let i = 0; i < S2T_INPUT; i++) {
            const question = this.questionRepo.create({
                quiz,
                type: QuestionType.SourceToTargetInput,
                textTemplate: await this.getTextTemplate(
                    QuestionType.SourceToTargetInput
                ),
                dictionaryWord: words[wordIndex],
            });
            questions.push(question);
            wordIndex++;
        }

        await this.questionRepo.save(questions);

        return quiz;
    };

    getTitle = async () => {
        const materialLevel = this.materialLevelId
            ? await this.materialLevelRepo.findOne({
                  where: { id: this.materialLevelId },
                  relations: { material: true },
              })
            : null;

        if (!materialLevel) {
            const lz = (num: number) => num.toString().padStart(2, "0");

            const date = new Date();

            return `Quiz ${date.getFullYear()}-${lz(date.getMonth() + 1)}-${lz(date.getDate())} ${lz(date.getHours())}:${lz(date.getMinutes())}`;
        }

        return `Quiz for ${materialLevel.material.title} - Level ${materialLevel.factor}`;
    };

    getSourceWords = async () => {
        if (!this.materialLevelId) {
            return this.getSourceWordsWithoutMaterialLevel();
        }

        return this.getSourceWordsForMaterialLevel();
    };

    getSourceWordsForMaterialLevel = async () => {
        let words = await this.dictionaryWordRepo.find({
            where: {
                dictionary: { id: this.dictionary.id },
                word: { sourceText: Not(In([".", ",", "!", "?", ":", ";"])) },
            },
            relations: { word: true },
        });
        const filterIds = await this.getFilterWordIds();

        if (filterIds.length > 0) {
            words = words.filter((dw) => filterIds.includes(dw.word.id));
        }

        return words.sort(() => Math.random() - 0.5);
    };

    getSourceWordsWithoutMaterialLevel = async () => {
        const allWords = await this.dictionaryWordRepo.find({
            where: {
                dictionary: { id: this.dictionary.id },
                word: { sourceText: Not(In([".", ",", "!", "?", ":", ";"])) },
            },
            relations: { word: true },
        });

        if (allWords.length < this.QUIZ_LENGTH) {
            throw new Error(
                "Not enough words in the dictionary to generate a quiz"
            );
        }

        const selectedWords = new Map<string, DictionaryWord>();
        const previousCorrectWordIds = new Set(
            await this.getPreviousCorrectWordIds()
        );
        const latestQuizWrongWords = await this.getLatestQuizWrongWords();
        const completedMaterialLevels = await this.getCompletedMaterialLevels();
        const latestMaterialLevelWordIds = completedMaterialLevels[0]
            ? await this.getMaterialLevelWordIds(completedMaterialLevels[0].id)
            : [];
        const penultimateMaterialLevelWordIds = completedMaterialLevels[1]
            ? await this.getMaterialLevelWordIds(completedMaterialLevels[1].id)
            : [];
        const oldMaterialLevelWordIds = await this.getOldMaterialLevelWordIds();
        const candidateWordsById = new Map(
            allWords.map((dictionaryWord) => [
                dictionaryWord.word.id,
                dictionaryWord,
            ])
        );

        const selectWords = (
            wordIds: string[],
            count: number,
            skipCorrectAnswers: boolean
        ) => {
            const pickedWords: DictionaryWord[] = [];
            const remainingSlots = this.QUIZ_LENGTH - selectedWords.size;
            const shuffledCandidates = wordIds
                .map((wordId) => candidateWordsById.get(wordId))
                .filter((dictionaryWord): dictionaryWord is DictionaryWord =>
                    Boolean(dictionaryWord)
                )
                .sort(() => Math.random() - 0.5);

            for (const candidateWord of shuffledCandidates) {
                if (
                    pickedWords.length >= count ||
                    pickedWords.length >= remainingSlots
                ) {
                    break;
                }

                if (selectedWords.has(candidateWord.id)) {
                    continue;
                }

                if (
                    skipCorrectAnswers &&
                    previousCorrectWordIds.has(candidateWord.word.id)
                ) {
                    continue;
                }

                selectedWords.set(candidateWord.id, candidateWord);
                pickedWords.push(candidateWord);
            }

            return pickedWords;
        };

        for (let i = 0; i < 10 && selectedWords.size < this.QUIZ_LENGTH; i++) {
            const beforeRound = selectedWords.size;

            selectWords(latestQuizWrongWords, 2, false);
            selectWords(latestMaterialLevelWordIds, 8, true);
            selectWords(penultimateMaterialLevelWordIds, 3, true);
            selectWords(oldMaterialLevelWordIds, 1, true);

            if (selectedWords.size === beforeRound) {
                break;
            }
        }

        if (selectedWords.size < this.QUIZ_LENGTH) {
            const remainingWords = allWords
                .filter(
                    (dictionaryWord) => !selectedWords.has(dictionaryWord.id)
                )
                .sort(() => Math.random() - 0.5);

            for (const dictionaryWord of remainingWords) {
                selectedWords.set(dictionaryWord.id, dictionaryWord);

                if (selectedWords.size >= this.QUIZ_LENGTH) {
                    break;
                }
            }
        }

        return [...selectedWords.values()].sort(() => Math.random() - 0.5);
    };

    getQuizLength = () =>
        this.materialLevelId ? this.QUIZ_SHORT_LENGTH : this.QUIZ_LENGTH;

    getPreviousCorrectWordIds = async () => {
        const previousCorrectAnswers = await this.quizAnswerRepo
            .createQueryBuilder("quizAnswer")
            .distinct(true)
            .innerJoin("quizAnswer.quizAttempt", "quizAttempt")
            .innerJoin("quizAttempt.quiz", "quiz")
            .innerJoin("quiz.dictionary", "dictionary")
            .innerJoin("quizAnswer.question", "question")
            .innerJoin("question.dictionaryWord", "dictionaryWord")
            .innerJoin("dictionaryWord.word", "word")
            .where("dictionary.id = :dictionaryId", {
                dictionaryId: this.dictionary.id,
            })
            .andWhere("quizAttempt.completedAt IS NOT NULL")
            .andWhere("quizAnswer.isCorrect = true")
            .select("word.id", "id")
            .getRawMany<{ id: string }>();

        return previousCorrectAnswers.map((answer) => answer.id);
    };

    getLatestQuizWrongWords = async () => {
        const latestCompletedQuizAttempt = await this.quizAttemptRepo
            .createQueryBuilder("quizAttempt")
            .innerJoin("quizAttempt.quiz", "quiz")
            .innerJoin("quiz.dictionary", "dictionary")
            .where("dictionary.id = :dictionaryId", {
                dictionaryId: this.dictionary.id,
            })
            .andWhere("quizAttempt.completedAt IS NOT NULL")
            .orderBy("quizAttempt.completedAt", "DESC")
            .addOrderBy("quizAttempt.createdAt", "DESC")
            .getOne();

        if (!latestCompletedQuizAttempt) {
            return [];
        }

        const wrongAnswers = await this.quizAnswerRepo
            .createQueryBuilder("quizAnswer")
            .distinct(true)
            .innerJoin("quizAnswer.quizAttempt", "quizAttempt")
            .innerJoin("quizAnswer.question", "question")
            .innerJoin("question.dictionaryWord", "dictionaryWord")
            .innerJoin("dictionaryWord.word", "word")
            .where("quizAttempt.id = :quizAttemptId", {
                quizAttemptId: latestCompletedQuizAttempt.id,
            })
            .andWhere("quizAnswer.isCorrect = false")
            .select("word.id", "id")
            .getRawMany<{ id: string }>();

        return wrongAnswers.map((answer) => answer.id);
    };

    getCompletedMaterialLevels = async () => {
        return this.userMaterialLevelRepo.find({
            where: {
                user: { id: this.dictionary.user.id },
                status: UserMaterialStatus.COMPLETED,
            },
            order: {
                updatedAt: "DESC",
            },
            take: 2,
        });
    };

    getMaterialLevelWordIds = async (materialLevelId: string) => {
        const result = await db.query(
            "SELECT w.id FROM words AS w INNER JOIN material_words AS mw ON mw.word_id = w.id INNER JOIN material_level_material_words AS mlmw ON mlmw.material_word_id = mw.id WHERE mlmw.material_level_id = $1",
            [materialLevelId]
        );

        return result.map((row: { id: string }) => row.id);
    };

    getOldMaterialLevelWordIds = async () => {
        const oldMaterialLevels = await this.userMaterialLevelRepo.find({
            where: {
                user: { id: this.dictionary.user.id },
                status: UserMaterialStatus.COMPLETED,
                updatedAt: LessThan(
                    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                ),
            },
        });

        const wordIds: string[] = [];

        for (const materialLevel of oldMaterialLevels) {
            wordIds.push(
                ...(await this.getMaterialLevelWordIds(materialLevel.id))
            );
        }

        return [...new Set(wordIds)];
    };

    getFilterWordIds = async () => {
        if (!this.materialLevelId) {
            return [];
        }

        const materialLevel = await this.materialLevelRepo.findOne({
            where: { id: this.materialLevelId },
            relations: { material: { languagePair: true } },
        });

        if (!materialLevel) {
            return [];
        }

        const result = await db.query(
            "SELECT w.id FROM words AS w INNER JOIN material_words AS mw ON mw.word_id = w.id INNER JOIN material_level_material_words AS mlmw ON mlmw.material_word_id = mw.id WHERE mlmw.material_level_id = $1",
            [this.materialLevelId]
        );

        return result.map((row: { id: string }) => row.id);
    };

    getTextTemplate = async (type: QuestionType) => {
        if (this.textTemplatesCache[type].length === 0) {
            this.textTemplatesCache[type] = await this.textTemplateRepo.find({
                where: { questionType: type },
            });
        }

        const templates = this.textTemplatesCache[type];

        if (templates.length === 0) {
            throw new Error(
                `No text templates found for question type ${type}`
            );
        }

        return templates[Math.floor(Math.random() * templates.length)];
    };
}
