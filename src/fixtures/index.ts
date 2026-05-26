import { AuthService } from "../adaptive-reading-module/auth/auth.service";
import db from "../data-source";
import {
    Dictionary,
    DictionaryWord,
    Language,
    LanguagePair,
    LanguageTextTemplate,
    TextTemplate,
    User,
    Word,
} from "../entities";
import { QuestionType } from "../entities/Question.entity";

const setupLanguages = async () => {
    const languageRepo = db.getRepository(Language);
    const languagePairRepo = db.getRepository(LanguagePair);

    const languages = [
        { name: "English", code: "en" },
        { name: "German", code: "de" },
        { name: "Ukrainian", code: "uk" },
    ];

    for (const lang of languages) {
        const language = languageRepo.create(lang);
        await languageRepo.save(language);
    }

    const english = await languageRepo.findOneByOrFail({ code: "en" });
    const german = await languageRepo.findOneByOrFail({ code: "de" });
    const ukrainian = await languageRepo.findOneByOrFail({ code: "uk" });

    const languagePairs = [
        { sourceLanguage: english, targetLanguage: ukrainian },
        { sourceLanguage: german, targetLanguage: ukrainian },
        { sourceLanguage: german, targetLanguage: english },
    ];

    for (const pair of languagePairs) {
        const languagePair = languagePairRepo.create(pair);
        await languagePairRepo.save(languagePair);
    }

    return {
        languages: {
            en: english,
            de: german,
            uk: ukrainian,
        },
        languagePairs: {
            enToUk: await languagePairRepo.findOneByOrFail({
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            }),
            deToUk: await languagePairRepo.findOneByOrFail({
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            }),
            deToEn: await languagePairRepo.findOneByOrFail({
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            }),
        },
    };
};

const setupUser = async () => {
    const auth = new AuthService();

    return await auth.register({
        email: "user@nure.ua",
        name: "Six Seven",
        password: "password",
    });
};

const setupTextTemplates = async (languages: {
    en: Language;
    de: Language;
    uk: Language;
}) => {
    const textTemplateRepo = db.getRepository(TextTemplate);
    const languageTextTemplateRepo = db.getRepository(LanguageTextTemplate);

    const templates = [
        {
            type: QuestionType.SourceSynonym,
            en: "Find a synonym for the word: {{word}}",
            de: "Finden Sie ein Synonym für das Wort: {{word}}",
            uk: "Знайдіть синонім до слова: {{word}}",
        },
        {
            type: QuestionType.TargetSynonym,
            en: "Find a synonym for the word: {{word}}",
            de: "Finden Sie ein Synonym für das Wort: {{word}}",
            uk: "Знайдіть синонім до слова: {{word}}",
        },
        {
            type: QuestionType.SourceToTargetTranslate,
            en: "Translate the word to {{targetLanguage}}: {{word}}",
            de: "Übersetzen Sie das Wort in {{targetLanguage}}: {{word}}",
            uk: "Перекладіть слово на {{targetLanguage}}: {{word}}",
        },
        {
            type: QuestionType.TargetToSourceTranslate,
            en: "Translate the word to {{sourceLanguage}}: {{word}}",
            de: "Übersetzen Sie das Wort in {{sourceLanguage}}: {{word}}",
            uk: "Перекладіть слово на {{sourceLanguage}}: {{word}}",
        },
    ];

    for (const temp of templates) {
        const textTemplate = textTemplateRepo.create({
            questionType: temp.type,
        });
        const savedTemplate = await textTemplateRepo.save(textTemplate);

        const languageTextTemplates = [
            {
                textTemplate: savedTemplate,
                language: languages.en,
                template: temp.en,
            },
            {
                textTemplate: savedTemplate,
                language: languages.de,
                template: temp.de,
            },
            {
                textTemplate: savedTemplate,
                language: languages.uk,
                template: temp.uk,
            },
        ];

        for (const ltt of languageTextTemplates) {
            const languageTextTemplate = languageTextTemplateRepo.create(ltt);
            await languageTextTemplateRepo.save(languageTextTemplate);
        }
    }
};

export const setupWords = async (userId: string) => {
    const wordRepo = db.getRepository(Word);
    const languagePairRepo = db.getRepository(LanguagePair);
    const deEn = [
        {
            sourceText: "Katze",
            translation: "cat",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Hund",
            translation: "dog",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Haus",
            translation: "house",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Auto",
            translation: "car",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Baum",
            translation: "tree",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Buch",
            translation: "book",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Wasser",
            translation: "water",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Essen",
            translation: "food",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Sonne",
            translation: "sun",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Mond",
            translation: "moon",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Stern",
            translation: "star",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Computer",
            translation: "computer",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Telefon",
            translation: "phone",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Tisch",
            translation: "table",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Stuhl",
            translation: "chair",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Fenster",
            translation: "window",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Tür",
            translation: "door",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Blume",
            translation: "flower",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
        {
            sourceText: "Gras",
            translation: "grass",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "en" },
            },
        },
    ];
    const deUk = [
        {
            sourceText: "Katze",
            translation: "кіт",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Hund",
            translation: "собака",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Haus",
            translation: "будинок",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Auto",
            translation: "автомобіль",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Baum",
            translation: "дерево",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Buch",
            translation: "книга",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Wasser",
            translation: "вода",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Essen",
            translation: "їжа",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Sonne",
            translation: "сонце",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Mond",
            translation: "місяць",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Stern",
            translation: "зірка",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Computer",
            translation: "комп'ютер",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Telefon",
            translation: "телефон",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Tisch",
            translation: "стіл",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Stuhl",
            translation: "стілець",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Fenster",
            translation: "вікно",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Tür",
            translation: "двері",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Blume",
            translation: "квітка",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "Gras",
            translation: "трава",
            languagePair: {
                sourceLanguage: { code: "de" },
                targetLanguage: { code: "uk" },
            },
        },
    ];
    const enUk = [
        {
            sourceText: "cat",
            translation: "кіт",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "dog",
            translation: "собака",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "house",
            translation: "будинок",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "car",
            translation: "автомобіль",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "tree",
            translation: "дерево",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "book",
            translation: "книга",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "water",
            translation: "вода",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "food",
            translation: "їжа",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "sun",
            translation: "сонце",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "moon",
            translation: "місяць",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "star",
            translation: "зірка",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "computer",
            translation: "комп'ютер",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "phone",
            translation: "телефон",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "table",
            translation: "стіл",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "chair",
            translation: "стілець",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "window",
            translation: "вікно",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "door",
            translation: "двері",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "flower",
            translation: "квітка",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
        {
            sourceText: "grass",
            translation: "трава",
            languagePair: {
                sourceLanguage: { code: "en" },
                targetLanguage: { code: "uk" },
            },
        },
    ];
    const deEnIds: string[] = [];
    const deUkIds: string[] = [];
    const enUkIds: string[] = [];

    const allWords = [...deEn, ...deUk, ...enUk];

    for (const wordData of allWords) {
        const languagePair = await languagePairRepo.findOneByOrFail({
            sourceLanguage: { code: wordData.languagePair.sourceLanguage.code },
            targetLanguage: { code: wordData.languagePair.targetLanguage.code },
        });

        const word = wordRepo.create({
            sourceText: wordData.sourceText,
            translation: wordData.translation,
            languagePair,
        });

        await wordRepo.save(word);

        if (
            wordData.languagePair.sourceLanguage.code === "de" &&
            wordData.languagePair.targetLanguage.code === "en"
        ) {
            deEnIds.push(word.id);
        } else if (
            wordData.languagePair.sourceLanguage.code === "de" &&
            wordData.languagePair.targetLanguage.code === "uk"
        ) {
            deUkIds.push(word.id);
        } else if (
            wordData.languagePair.sourceLanguage.code === "en" &&
            wordData.languagePair.targetLanguage.code === "uk"
        ) {
            enUkIds.push(word.id);
        }
    }

    const dictionaryRepo = db.getRepository(Dictionary);
    const dictionaryWordRepo = db.getRepository(DictionaryWord);
    const pairs = await languagePairRepo.find({
        relations: {
            sourceLanguage: true,
            targetLanguage: true,
        },
    });

    for (const pair of pairs) {
        const dictionary = dictionaryRepo.create({
            user: { id: userId },
            languagePair: pair,
        });

        await dictionaryRepo.save(dictionary);

        const wordIds =
            pair.sourceLanguage.code === "de" &&
            pair.targetLanguage.code === "en"
                ? deEnIds
                : pair.sourceLanguage.code === "de" &&
                    pair.targetLanguage.code === "uk"
                  ? deUkIds
                  : enUkIds;

        for (const wordId of wordIds) {
            const dictionaryWord = dictionaryWordRepo.create({
                dictionary,
                word: { id: wordId },
            });

            await dictionaryWordRepo.save(dictionaryWord);
        }
    }
};

export const setupFixtures = async () => {
    const userRepo = db.getRepository(User);

    if ((await userRepo.count()) !== 0) {
        return;
    }

    const lng = await setupLanguages();
    const user = await setupUser();

    await setupTextTemplates(lng.languages);
    await setupWords(user.id);
};
