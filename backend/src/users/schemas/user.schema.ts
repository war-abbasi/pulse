import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  // The unique index is what actually enforces uniqueness — it is enforced by
  // MongoDB itself, so two concurrent registrations cannot both succeed.
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  // select: false keeps the hash out of every query result by default. Code
  // that genuinely needs it (credential checking) must ask for it explicitly
  // with .select('+password'). This fails safe: forgetting to strip the field
  // somewhere leaks nothing, because it was never fetched.
  @Prop({ required: true, select: false })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
