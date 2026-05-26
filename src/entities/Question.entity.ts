import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { TextTemplate } from "./TextTemplate.entity";
import { Quiz } from "./Quiz.entity";
import { DictionaryWord } from "./DictionaryWord.entity";

export enum QuestionType {
    SourceToTargetTranslate = "s2t_translate",
    TargetToSourceTranslate = "t2s_translate",
    SourceSynonym = "s_synonym",
    TargetSynonym = "t_synonym",
}

@Entity({ name: "questions" })
export class Question {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "enum", enum: QuestionType, nullable: false })
    type!: QuestionType;

    @ManyToOne(() => TextTemplate, { nullable: false })
    @JoinColumn({ name: "text_template_id" })
    textTemplate!: TextTemplate;

    @ManyToOne(() => Quiz, { nullable: false })
    @JoinColumn({ name: "quiz_id" })
    quiz!: Quiz;

    @ManyToOne(() => DictionaryWord, { nullable: true })
    @JoinColumn({ name: "dictionary_word_id" })
    dictionaryWord!: DictionaryWord | null;
}
