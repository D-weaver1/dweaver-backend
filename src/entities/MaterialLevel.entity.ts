import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { Material } from "./Material.entity";

@Entity({ name: "material_levels" })
@Unique(["material", "factor"])
export class MaterialLevel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "int" })
    factor!: number;

    @ManyToOne(() => Material, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_id" })
    material!: Material;

    @Column({ type: "text" })
    text!: string;
}
