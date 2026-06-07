import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User.entity";
import { MaterialLevel } from "./MaterialLevel.entity";
import { UserMaterialStatus } from "./enums";

@Entity({ name: "user_material_level" })
export class UserMaterialLevel {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => MaterialLevel, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "material_level_id" })
    materialLevel!: MaterialLevel;

    @Column({
        type: "enum",
        enum: UserMaterialStatus,
        default: UserMaterialStatus.NOT_STARTED,
    })
    status!: UserMaterialStatus;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
