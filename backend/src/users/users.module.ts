import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  // Exported so AuthModule can inject UsersService. Without this line the
  // provider stays private to this module and injection fails at boot.
  exports: [UsersService],
})
export class UsersModule {}
