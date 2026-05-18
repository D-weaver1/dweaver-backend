import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { AiAnalysisJob } from "./AiAnalysisJob.entity";

@Entity({ name: "ai_analysis_job_payloads" })
export class AiAnalysisJobPayload {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToOne(() => AiAnalysisJob, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "job_id" })
    job!: AiAnalysisJob;

    @Column({ type: "text", name: "original_text" })
    originalText!: string;

    @Column({ type: "jsonb", nullable: true, name: "chunks_json" })
    chunksJson!: unknown | null;

    @Column({ type: "jsonb", nullable: true, name: "partial_result_json" })
    partialResultJson!: unknown | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
