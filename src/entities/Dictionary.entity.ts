import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { LanguagePair } from "./LanguagePair.entity";
import { User } from "./User.entity";

@Entity({ name: "dictionaries" })
export class Dictionary {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => LanguagePair)
    @JoinColumn({ name: "language_pair_id" })
    languagePair!: LanguagePair;
}
