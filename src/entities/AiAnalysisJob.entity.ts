import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { LanguagePair } from "./LanguagePair.entity";
import { AiAnalysisJobStatus, LanguageLevel } from "./enums";

@Entity({ name: "ai_analysis_jobs" })
export class AiAnalysisJob {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "batch_id" })
    batchId!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({
        type: "enum",
        enum: LanguageLevel,
        name: "language_level",
    })
    languageLevel!: LanguageLevel;

    @ManyToOne(() => LanguagePair, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "language_pair_id" })
    languagePair!: LanguagePair;

    @Column({
        type: "enum",
        enum: AiAnalysisJobStatus,
        default: AiAnalysisJobStatus.PENDING,
    })
    status!: AiAnalysisJobStatus;

    @Column({ type: "text", nullable: true, name: "error_message" })
    errorMessage!: string | null;

    @Column({ type: "int", default: 0, name: "attempt_count" })
    attemptCount!: number;

    @Column({ type: "int", default: 0, name: "current_chunk_index" })
    currentChunkIndex!: number;

    @Column({ type: "int", default: 0, name: "total_chunks" })
    totalChunks!: number;

    @Column({ type: "timestamp", nullable: true, name: "next_attempt_at" })
    nextAttemptAt!: Date | null;

    // Тимчасове поле для перевірки роботи модуля.
    // Після інтеграції з другим модулем результат буде передаватися напряму.
    @Column({ type: "jsonb", nullable: true, name: "result_json" })
    resultJson!: unknown | null;

    @Column({ type: "timestamp", nullable: true, name: "started_at" })
    startedAt!: Date | null;

    @Column({ type: "timestamp", nullable: true, name: "completed_at" })
    completedAt!: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
