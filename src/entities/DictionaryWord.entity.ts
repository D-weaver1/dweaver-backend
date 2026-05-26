import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Dictionary } from "./Dictionary.entity";
import { Word } from "./Word.entity";

@Entity({ name: "dictionary_words" })
export class DictionaryWord {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Dictionary)
    @JoinColumn({ name: "dictionary_id" })
    dictionary!: Dictionary;

    @ManyToOne(() => Word)
    @JoinColumn({ name: "word_id" })
    word!: Word;

    @CreateDateColumn({ name: "added_at" })
    addedAt!: Date;
}
