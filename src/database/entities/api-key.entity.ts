import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Application } from './application.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  keyHash: string; // Store hashed key

  @Column({ nullable: true })
  keyPrefix: string; // Store first few chars for identification e.g. "abc..."

  @ManyToOne(() => Application, application => application.apiKeys, { onDelete: 'CASCADE' })
  application: Application;

  @Column()
  applicationId: string; // Foreign key shadow property

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}