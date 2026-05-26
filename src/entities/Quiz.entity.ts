import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Dictionary } from "./Dictionary.entity";
import { QuizAttempt } from "./QuizAttempt.entity";
import { Question } from "./Question.entity";

@Entity({ name: "quizzes" })
export class Quiz {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Dictionary, { nullable: false })
    @JoinColumn({ name: "dictionary_id" })
    dictionary!: Dictionary;

    @OneToMany(() => Question, (question) => question.quiz)
    questions!: Question[];

    @OneToMany(() => QuizAttempt, (quizAttempt) => quizAttempt.quiz)
    quizAttempts!: QuizAttempt[];
}
