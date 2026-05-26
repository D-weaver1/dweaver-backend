import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Question } from "./Question.entity";
import { QuizAttempt } from "./QuizAttempt.entity";

@Entity({ name: "quiz_answers" })
export class QuizAnswer {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => QuizAttempt, { nullable: false })
    @JoinColumn({ name: "quiz_attempt_id" })
    quizAttempt!: QuizAttempt;

    @ManyToOne(() => Question, { nullable: false })
    @JoinColumn({ name: "question_id" })
    question!: Question;

    @Column({ type: "text", nullable: false })
    answer!: string;

    @Column({ type: "boolean", nullable: false })
    isCorrect!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
