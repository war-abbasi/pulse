import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    create: vi.fn(),
    findByUsernameWithPassword: vi.fn(),
  };
  const jwtService = { signAsync: vi.fn().mockResolvedValue('signed.jwt.token') };

  const userId = new Types.ObjectId();
  const buildUser = (passwordHash: string) => ({
    _id: userId,
    fullName: 'Ada Lovelace',
    username: 'ada',
    password: passwordHash,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('signed.jwt.token');
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('returns a token and the public user for correct credentials', async () => {
      const hash = await bcrypt.hash('secret123', 4);
      usersService.findByUsernameWithPassword.mockResolvedValue(buildUser(hash));

      const result = await service.login({ username: 'ada', password: 'secret123' });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: userId.toString(),
        fullName: 'Ada Lovelace',
        username: 'ada',
      });
    });

    it('never exposes the password hash in the response', async () => {
      const hash = await bcrypt.hash('secret123', 4);
      usersService.findByUsernameWithPassword.mockResolvedValue(buildUser(hash));

      const result = await service.login({ username: 'ada', password: 'secret123' });

      expect(JSON.stringify(result)).not.toContain(hash);
      expect(result.user).not.toHaveProperty('password');
    });

    it('signs only non-sensitive claims into the token', async () => {
      const hash = await bcrypt.hash('secret123', 4);
      usersService.findByUsernameWithPassword.mockResolvedValue(buildUser(hash));

      await service.login({ username: 'ada', password: 'secret123' });

      // A JWT payload is readable by anyone holding the token.
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: userId.toString(),
        username: 'ada',
      });
    });

    it('rejects a wrong password with 401', async () => {
      const hash = await bcrypt.hash('secret123', 4);
      usersService.findByUsernameWithPassword.mockResolvedValue(buildUser(hash));

      await expect(
        service.login({ username: 'ada', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown user with 401', async () => {
      usersService.findByUsernameWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nobody', password: 'secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('gives the same message for a bad password and an unknown user', async () => {
      const hash = await bcrypt.hash('secret123', 4);

      usersService.findByUsernameWithPassword.mockResolvedValue(null);
      const unknown = await service.login({ username: 'nobody', password: 'x' }).catch((e) => e);

      usersService.findByUsernameWithPassword.mockResolvedValue(buildUser(hash));
      const wrong = await service.login({ username: 'ada', password: 'x' }).catch((e) => e);

      // Distinguishing the two would let an attacker enumerate valid usernames.
      expect(unknown.message).toBe(wrong.message);
    });
  });

  describe('register', () => {
    it('issues a token so the user is logged in immediately after signing up', async () => {
      usersService.create.mockResolvedValue(buildUser('irrelevant-hash'));

      const result = await service.register({
        fullName: 'Ada Lovelace',
        username: 'ada',
        password: 'secret123',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
