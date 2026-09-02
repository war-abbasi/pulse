import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { RegisterDto } from '../users/dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthResponse } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './types/jwt-payload.js';

// Credential endpoints are the ones worth throttling: they are unauthenticated
// and are what an attacker would hammer.
@UseGuards(RateLimitGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 201 Created is the correct default here — a user resource is created. */
  @Post('register')
  // Signup is a write; a handful per minute is far above real usage.
  @RateLimit({ limit: 5, windowMs: 60_000 })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /**
   * Logging in creates no resource, so the default 201 would be wrong.
   * 200 OK is the right answer for "here is your token".
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Ten attempts a minute leaves room for genuine typos while making an
  // online password-guessing attack impractical.
  @RateLimit({ limit: 10, windowMs: 60_000 })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /** Lets the frontend confirm a stored token is still valid on page load. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
