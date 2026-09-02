import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';
import { toNotificationResponse } from './notifications.mapper.js';
import type { NotificationResponse } from './notifications.mapper.js';
import { NotificationsService } from './notifications.service.js';

// Applied at controller level, so every route below is protected. Adding a new
// endpoint here cannot accidentally be left public.
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<NotificationResponse[]> {
    const notifications = await this.notificationsService.findAllForUser(user.userId);
    return notifications.map(toNotificationResponse);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<NotificationResponse> {
    return toNotificationResponse(await this.notificationsService.findOneForUser(user.userId, id));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    return toNotificationResponse(await this.notificationsService.create(user.userId, dto));
  }

  // PATCH is the accurate verb: every field is optional, and dismissing a
  // banner sends only { isClosed: true }. PUT is accepted as an alias so the
  // API stays usable by clients that expect it.
  @Patch(':id')
  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<NotificationResponse> {
    return toNotificationResponse(
      await this.notificationsService.update(user.userId, id, dto),
    );
  }

  /** 204: the delete succeeded and there is nothing meaningful to return. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<void> {
    await this.notificationsService.remove(user.userId, id);
  }
}
