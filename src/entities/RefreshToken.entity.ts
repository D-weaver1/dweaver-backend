import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.entity";

@Entity("refresh_tokens")
export class RefreshToken {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ name: "token_hash", type: "varchar", length: 255, unique: true })
    tokenHash!: string;

    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt!: Date;

    @Column({ name: "revoked_at", type: "timestamp", nullable: true })
    revokedAt!: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
