import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../enums/category.enum.js';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, trim: true })
  header: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ required: true, type: String, enum: Category })
  category: Category;

  /** Whether the user has dismissed this notification's banner. */
  @Prop({ required: true, default: false })
  isClosed: boolean;

  // Stored as a real ObjectId with a ref, not a string. This keeps the type
  // consistent with User._id and allows populate() later if ever needed.
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  // Supplied by timestamps: true. Declared so TypeScript knows about them.
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Every list query is "this user's notifications, newest first". A compound
// index matching that exactly lets MongoDB satisfy it without an in-memory sort.
NotificationSchema.index({ userId: 1, createdAt: -1 });
