import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from "typeorm";
import { Language } from "./Language.entity";

@Entity({ name: "language_pairs" })
@Unique(["sourceLanguage", "targetLanguage"])
export class LanguagePair {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Language)
    @JoinColumn({ name: "source_language_id" })
    sourceLanguage!: Language;

    @ManyToOne(() => Language)
    @JoinColumn({ name: "target_language_id" })
    targetLanguage!: Language;
}
