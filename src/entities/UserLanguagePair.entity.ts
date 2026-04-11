import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { User } from "./User.entity";
import { LanguagePair } from "./LanguagePair.entity";
import { UserLanguagePairStatus } from "./enums";

@Entity({ name: "user_language_pairs" })
@Unique(["user", "languagePair"])
export class UserLanguagePair {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => LanguagePair, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "language_pair_id" })
    languagePair!: LanguagePair;

    @Column({
        type: "enum",
        enum: UserLanguagePairStatus,
        default: UserLanguagePairStatus.ACTIVE,
    })
    status!: UserLanguagePairStatus;

    @Column({ type: "timestamp", nullable: true, name: "last_used" })
    lastUsed!: Date | null;
}
