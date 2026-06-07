import db from "../data-source";
import { TextTemplate } from "../entities";
import { QuestionType } from "../entities/Question.entity";

const textTemplateRepo = db.getRepository(TextTemplate);

export const presetData = async () => {
    const questionTypes = [
        QuestionType.SourceToTargetInput,
        QuestionType.SourceToTargetTranslate,
        QuestionType.TargetToSourceTranslate,
    ];

    for (const questionType of questionTypes) {
        const existing = await textTemplateRepo.findOne({
            where: { questionType },
        });

        if (!existing) {
            const newTemplate = textTemplateRepo.create({ questionType });
            await textTemplateRepo.save(newTemplate);
            console.log(
                `Created text template for question type: ${questionType}`
            );
        }
    }
};
