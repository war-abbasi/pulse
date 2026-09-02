import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    // .register() matters: the bare PassportModule class is declared
    // @Module({}) with no providers, so it supplies nothing. Only the dynamic
    // module returned by register() provides AuthModuleOptions, which every
    // AuthGuard injects.
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // registerAsync because the secret comes from ConfigService, which does
    // not exist yet at module-definition time.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // The typing wants ms's StringValue union ('1d', '15m', ...); the
          // value is validated by JwtModule at runtime.
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '1d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // PassportModule must be re-exported, not just AuthService: JwtAuthGuard
  // injects AuthModuleOptions, which PassportModule provides. Without this,
  // any module applying the guard fails to resolve its dependencies at boot.
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
