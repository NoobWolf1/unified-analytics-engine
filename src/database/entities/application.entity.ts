import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { ApiKey } from './api-key.entity';
import { Event } from './event.entity';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @ManyToOne(() => User, user => user.applications, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: string; // Foreign key shadow property

  @OneToMany(() => ApiKey, apiKey => apiKey.application)
  apiKeys: ApiKey[];

  @OneToMany(() => Event, event => event.application)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}