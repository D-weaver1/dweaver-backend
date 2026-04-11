import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import { User } from "./User.entity";
import { Material } from "./Material.entity";
import { UserMaterialStatus } from "./enums";

@Entity({ name: "user_materials" })
@Unique(["user", "material"])
export class UserMaterial {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => Material, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_id" })
    material!: Material;

    @Column({
        type: "enum",
        enum: UserMaterialStatus,
        default: UserMaterialStatus.NOT_STARTED,
    })
    status!: UserMaterialStatus;
}
