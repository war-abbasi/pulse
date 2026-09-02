import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';
import { Notification, NotificationDocument } from './schemas/notification.schema.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  create(userId: string, dto: CreateNotificationDto): Promise<NotificationDocument> {
    // userId comes from the verified JWT, never from the request body, so a
    // client cannot create notifications on someone else's behalf.
    return this.notificationModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      isClosed: false,
    });
  }

  findAllForUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneForUser(userId: string, id: string): Promise<NotificationDocument> {
    // Ownership is part of the query rather than a check performed afterwards.
    // There is no code path that can read a document and forget to compare the
    // owner — the database simply never returns another user's row. This is
    // the defence against IDOR.
    const notification = await this.notificationModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (!notification) {
      // 404 rather than 403: telling an attacker "this exists but is not
      // yours" confirms the id is real. Indistinguishable responses leak less.
      throw new NotFoundException('Notification not found.');
    }
    return notification;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOneAndUpdate({ _id: id, userId: new Types.ObjectId(userId) }, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }
    return notification;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.notificationModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found.');
    }
  }
}
