import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // isGlobal means every other module can inject ConfigService without
    // importing ConfigModule again.
    ConfigModule.forRoot({ isGlobal: true }),

    // forRootAsync so the connection string comes from config rather than
    // being hardcoded. getOrThrow fails fast at boot if MONGO_URI is missing,
    // instead of silently connecting to the wrong place.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    UsersModule,
    AuthModule,
    NotificationsModule,
  ],
})
export class AppModule {}
