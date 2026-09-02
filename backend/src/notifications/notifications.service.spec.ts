import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category } from './enums/category.enum.js';
import { NotificationsService } from './notifications.service.js';
import { Notification } from './schemas/notification.schema.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const model = {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  };

  const ownerId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const notificationId = new Types.ObjectId().toString();

  // Helpers for the chained Mongoose query builder.
  const execResolving = (value: unknown) => ({ exec: vi.fn().mockResolvedValue(value) });
  const sortResolving = (value: unknown) => ({ sort: vi.fn().mockReturnValue(execResolving(value)) });

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  describe('create', () => {
    it('stamps the owner from the authenticated user, not the request body', async () => {
      model.create.mockImplementation((doc: unknown) => Promise.resolve(doc));

      await service.create(ownerId, {
        header: 'Deploy finished',
        body: 'Version 2.1 is live',
        category: Category.INFO,
      });

      const saved = model.create.mock.calls[0][0] as { userId: Types.ObjectId };
      expect(saved.userId.toString()).toBe(ownerId);
    });

    it('always creates the notification undismissed', async () => {
      model.create.mockImplementation((doc: unknown) => Promise.resolve(doc));

      await service.create(ownerId, {
        header: 'h',
        body: 'b',
        category: Category.WARNING,
      });

      expect(model.create.mock.calls[0][0]).toMatchObject({ isClosed: false });
    });
  });

  describe('findAllForUser', () => {
    it('scopes the query to the user and sorts newest first', async () => {
      const sortMock = sortResolving([]);
      model.find.mockReturnValue(sortMock);

      await service.findAllForUser(ownerId);

      const filter = model.find.mock.calls[0][0] as { userId: Types.ObjectId };
      expect(filter.userId.toString()).toBe(ownerId);
      expect(sortMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOneForUser', () => {
    it('includes the owner in the query rather than checking after the fact', async () => {
      model.findOne.mockReturnValue(execResolving({ _id: notificationId }));

      await service.findOneForUser(ownerId, notificationId);

      const filter = model.findOne.mock.calls[0][0] as {
        _id: string;
        userId: Types.ObjectId;
      };
      expect(filter._id).toBe(notificationId);
      expect(filter.userId.toString()).toBe(ownerId);
    });

    it("throws 404 when the notification belongs to a different user (IDOR)", async () => {
      // The document exists, but not for this user, so the scoped query
      // returns null. This is the regression test for insecure direct object
      // reference: another user's id must never resolve.
      model.findOne.mockReturnValue(execResolving(null));

      await expect(
        service.findOneForUser(otherUserId, notificationId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('scopes the update to the owner', async () => {
      model.findOneAndUpdate.mockReturnValue(execResolving({ _id: notificationId }));

      await service.update(ownerId, notificationId, { isClosed: true });

      const [filter, changes] = model.findOneAndUpdate.mock.calls[0] as [
        { _id: string; userId: Types.ObjectId },
        unknown,
      ];
      expect(filter._id).toBe(notificationId);
      expect(filter.userId.toString()).toBe(ownerId);
      expect(changes).toEqual({ isClosed: true });
    });

    it("throws 404 rather than editing another user's notification", async () => {
      model.findOneAndUpdate.mockReturnValue(execResolving(null));

      await expect(
        service.update(otherUserId, notificationId, { header: 'pwned' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes only when the notification belongs to the user', async () => {
      model.deleteOne.mockReturnValue(execResolving({ deletedCount: 1 }));

      await service.remove(ownerId, notificationId);

      const filter = model.deleteOne.mock.calls[0][0] as { userId: Types.ObjectId };
      expect(filter.userId.toString()).toBe(ownerId);
    });

    it("throws 404 rather than deleting another user's notification", async () => {
      model.deleteOne.mockReturnValue(execResolving({ deletedCount: 0 }));

      await expect(
        service.remove(otherUserId, notificationId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
