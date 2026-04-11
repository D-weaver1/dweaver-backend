import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "languages" })
export class Language {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ type: "varchar", length: 10, unique: true })
    code!: string;
}
