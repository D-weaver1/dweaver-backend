import { In, Not, Repository } from "typeorm";
import db from "../../data-source";
import {
    Dictionary,
    DictionaryWord,
    Question,
    Quiz,
    TextTemplate,
} from "../../entities";
import { QuestionType } from "../../entities/Question.entity";

export class QuizService {
    private readonly QUIZ_LENGTH = 14;

    private readonly dictionaryWordRepo: Repository<DictionaryWord>;
    private readonly quizRepo: Repository<Quiz>;
    private readonly questionRepo: Repository<Question>;
    private readonly textTemplateRepo: Repository<TextTemplate>;

    private textTemplatesCache: Record<QuestionType, TextTemplate[]>;

    constructor(private readonly dictionary: Dictionary) {
        this.dictionaryWordRepo = db.getRepository(DictionaryWord);
        this.questionRepo = db.getRepository(Question);
        this.quizRepo = db.getRepository(Quiz);
        this.textTemplateRepo = db.getRepository(TextTemplate);
        this.textTemplatesCache = {
            [QuestionType.SourceSynonym]: [],
            [QuestionType.TargetSynonym]: [],
            [QuestionType.SourceToTargetTranslate]: [],
            [QuestionType.TargetToSourceTranslate]: [],
        };
    }

    generate = async () => {
        const words = await this.getSourceWords();

        if (words.length < this.QUIZ_LENGTH) {
            throw new Error(
                "Not enough words in the dictionary to generate a quiz"
            );
        }

        const SYNONYM_SRC = 0;
        const SYNONYM_TGT = 0;
        const S2T_TRANSLATE = 7;
        const T2S_TRANSLATE = 7;

        const quiz = this.quizRepo.create({ dictionary: this.dictionary });
        await this.quizRepo.save(quiz);

        const questions: Question[] = [];

        let wordIndex = 0;

        for (let i = 0; i < SYNONYM_SRC; i++) {
            const question = this.questionRepo.create({
                quiz,
                type: QuestionType.SourceSynonym,
                textTemplate: await this.getTextTemplate(
                    QuestionType.SourceSynonym
                ),
                dictionaryWord: words[wordIndex],
            });
            questions.push(question);
            wordIndex++;
        }

        for (let i = 0; i < SYNONYM_TGT; i++) {
            const question = this.questionRepo.create({
                quiz,
                type: QuestionType.TargetSynonym,
                textTemplate: await this.getTextTemplate(
                    QuestionType.TargetSynonym
                ),
                dictionaryWord: words[wordIndex],
            });
            questions.push(question);
            wordIndex++;
        }

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

        await this.questionRepo.save(questions);

        return quiz;
    };

    getSourceWords = async () => {
        const words = await this.dictionaryWordRepo.find({
            where: {
                dictionary: { id: this.dictionary.id },
                word: { sourceText: Not(In([".", ",", "!", "?", ":", ";"])) },
            },
            relations: { word: true },
            take: this.QUIZ_LENGTH,
        });

        return words.sort(() => Math.random() - 0.5);
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
