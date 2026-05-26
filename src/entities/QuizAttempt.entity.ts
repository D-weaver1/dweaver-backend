import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Quiz } from "./Quiz.entity";
import { QuizAnswer } from "./QuizAnswer.entity";

@Entity({ name: "quiz_attempts" })
export class QuizAttempt {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Quiz, { nullable: false })
    @JoinColumn({ name: "quiz_id" })
    quiz!: Quiz;

    @OneToMany(() => QuizAnswer, (quizAnswer) => quizAnswer.quizAttempt)
    quizAnswers!: QuizAnswer[];

    @Column({ type: "timestamp", name: "completed_at", nullable: true })
    completedAt!: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
