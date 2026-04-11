import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { Word } from "./Word.entity";
import { Material } from "./Material.entity";

@Entity({ name: "material_words" })
@Unique(["word", "material"])
export class MaterialWord {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Word, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "word_id" })
    word!: Word;

    @ManyToOne(() => Material, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_id" })
    material!: Material;

    @Column({ type: "jsonb" })
    indexes!: number[];
}
