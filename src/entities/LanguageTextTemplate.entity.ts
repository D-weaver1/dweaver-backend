import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { TextTemplate } from "./TextTemplate.entity";
import { Language } from "./Language.entity";

@Entity({ name: "language_text_templates" })
export class LanguageTextTemplate {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => TextTemplate, { nullable: false })
    @JoinColumn({ name: "text_template_id" })
    textTemplate!: TextTemplate;

    @ManyToOne(() => Language, { nullable: false })
    @JoinColumn({ name: "language_id" })
    language!: Language;

    @Column({ type: "text", nullable: false })
    template!: string;
}
