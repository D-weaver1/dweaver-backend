import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { LanguagePair } from "./LanguagePair.entity";

@Entity({ name: "words" })
@Unique(["sourceText", "translation", "languagePair"])
export class Word {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255, name: "source_text" })
    sourceText!: string;

    @Column({ type: "varchar", length: 255 })
    translation!: string;

    @ManyToOne(() => LanguagePair, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "language_pair_id" })
    languagePair!: LanguagePair;
}
