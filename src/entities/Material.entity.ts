import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { LanguagePair } from "./LanguagePair.entity";
import { LanguageLevel } from "./enums";

@Entity({ name: "materials" })
export class Material {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({
        type: "enum",
        enum: LanguageLevel,
        name: "language_level",
    })
    languageLevel!: LanguageLevel;

    @ManyToOne(() => LanguagePair, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "language_pair_id" })
    languagePair!: LanguagePair;

    @Column({ type: "text" })
    text!: string;
}
