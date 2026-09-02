import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { RegisterDto } from './dto/register.dto.js';
import { User, UserDocument } from './schemas/user.schema.js';

// Work factor for bcrypt. Higher is slower and therefore harder to brute
// force; 12 is a common current default, roughly a quarter second per hash.
const SALT_ROUNDS = 12;

// MongoDB's error code for a unique index violation.
const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(dto: RegisterDto): Promise<UserDocument> {
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.userModel.create({ ...dto, password });
    } catch (error) {
      // Rather than checking "does this username exist?" first and then
      // inserting, we just insert and let the unique index reject it. The
      // check-then-insert version has a race: two simultaneous registrations
      // can both pass the check before either writes.
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR) {
        throw new ConflictException('That username is already taken.');
      }
      throw error;
    }
  }

  /**
   * Looks up a user for credential checking. Explicitly re-selects the
   * password hash, which the schema excludes by default.
   */
  findByUsernameWithPassword(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).select('+password').exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
