// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createOrUpdateUser(profile: { googleId: string; email: string; name?: string }): Promise<User> {
    let user = await this.findByGoogleId(profile.googleId);
    if (user) {
      user.email = profile.email; // Keep email updated
      user.name = profile.name || user.name;
    } else {
      user = this.usersRepository.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
      });
    }
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }
}