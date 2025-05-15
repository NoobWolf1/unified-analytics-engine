import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Application } from './application.entity';

@Entity('events')
@Index(['applicationId', 'timestamp']) // For time-based queries per app
@Index(['applicationId', 'eventName', 'timestamp']) // For event-based queries
@Index(['applicationId', 'clientUserId', 'timestamp']) // For user-based queries
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, application => application.events, { onDelete: 'CASCADE' })
  application: Application;

  @Column()
  applicationId: string;

  @Column()
  @Index()
  eventName: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  referrer?: string;

  @Column()
  deviceType: string; // e.g., 'mobile', 'desktop', 'tablet'

  @Column({ nullable: true })
  ipAddress?: string; // Consider anonymization/hashing for PII

  @Column({ nullable: true })
  @Index()
  clientUserId?: string; // An identifier for the end-user provided by the client app

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // browser, os, screenSize, custom data

  @Column({ type: 'timestamp with time zone' })
  @Index()
  timestamp: Date;

  @CreateDateColumn() // DB insertion time
  dbCreatedAt: Date;
}