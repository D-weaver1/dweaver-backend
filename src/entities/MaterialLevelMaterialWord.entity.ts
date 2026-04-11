import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { MaterialWord } from "./MaterialWord.entity";
import { MaterialLevel } from "./MaterialLevel.entity";

@Entity({ name: "material_level_material_words" })
@Unique(["materialWord", "materialLevel"])
export class MaterialLevelMaterialWord {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => MaterialWord, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_word_id" })
    materialWord!: MaterialWord;

    @ManyToOne(() => MaterialLevel, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_level_id" })
    materialLevel!: MaterialLevel;
}
