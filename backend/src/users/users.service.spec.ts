import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const userModel = { create: vi.fn(), findOne: vi.fn(), findById: vi.fn() };

  const dto = { fullName: 'Ada Lovelace', username: 'ada', password: 'secret123' };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getModelToken(User.name), useValue: userModel }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('stores a bcrypt hash rather than the plaintext password', async () => {
      userModel.create.mockImplementation((doc: unknown) => Promise.resolve(doc));

      await service.create(dto);

      const stored = userModel.create.mock.calls[0][0] as { password: string };
      expect(stored.password).not.toBe(dto.password);
      // $2b$ is the bcrypt identifier; 12 is the cost factor we configured.
      expect(stored.password).toMatch(/^\$2[aby]\$12\$/);
      // The hash must still verify against the original password.
      await expect(bcrypt.compare(dto.password, stored.password)).resolves.toBe(true);
    });

    it('passes through the non-secret fields unchanged', async () => {
      userModel.create.mockImplementation((doc: unknown) => Promise.resolve(doc));

      await service.create(dto);

      expect(userModel.create.mock.calls[0][0]).toMatchObject({
        fullName: 'Ada Lovelace',
        username: 'ada',
      });
    });

    it('translates a duplicate-key error into a 409 ConflictException', async () => {
      // 11000 is MongoDB's unique-index violation code. We rely on the index
      // rather than a check-then-insert, which would race.
      userModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows errors that are not duplicate-key violations', async () => {
      const failure = new Error('connection lost');
      userModel.create.mockRejectedValue(failure);

      await expect(service.create(dto)).rejects.toThrow('connection lost');
    });
  });

  describe('findByUsernameWithPassword', () => {
    it('explicitly re-selects the password, which the schema hides by default', async () => {
      const exec = vi.fn().mockResolvedValue(null);
      const select = vi.fn().mockReturnValue({ exec });
      userModel.findOne.mockReturnValue({ select });

      await service.findByUsernameWithPassword('ada');

      expect(userModel.findOne).toHaveBeenCalledWith({ username: 'ada' });
      expect(select).toHaveBeenCalledWith('+password');
    });
  });
});
