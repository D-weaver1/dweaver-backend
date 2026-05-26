import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { LanguageTextTemplate } from "./LanguageTextTemplate.entity";
import { QuestionType } from "./Question.entity";

@Entity({ name: "text_templates" })
export class TextTemplate {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "enum", enum: QuestionType, nullable: true })
    questionType!: QuestionType | null;

    @OneToMany(
        () => LanguageTextTemplate,
        (languageTextTemplate) => languageTextTemplate.textTemplate
    )
    languageTextTemplates!: LanguageTextTemplate[];
}
