import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { RegisterDto } from '../users/dto/register.dto.js';
import { toPublicUser } from '../users/users.mapper.js';
import { UsersService } from '../users/users.service.js';
import type { AuthResponse } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './types/jwt-payload.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user._id.toString(), user.username, toPublicUser(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByUsernameWithPassword(dto.username);

    // Deliberately the same error for "no such user" and "wrong password".
    // Distinguishing them would let an attacker enumerate valid usernames.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    return this.buildAuthResponse(user._id.toString(), user.username, toPublicUser(user));
  }

  private async buildAuthResponse(
    sub: string,
    username: string,
    user: AuthResponse['user'],
  ): Promise<AuthResponse> {
    const payload: JwtPayload = { sub, username };
    // A JWT payload is base64-encoded, not encrypted — anyone holding the token
    // can read it. Only non-sensitive identifiers go in here.
    return { accessToken: await this.jwtService.signAsync(payload), user };
  }
}
