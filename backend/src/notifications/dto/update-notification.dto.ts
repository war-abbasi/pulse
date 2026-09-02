import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Category } from '../enums/category.enum.js';

/**
 * Every field optional so the same endpoint serves a full edit and a one-field
 * update (dismissing a banner sends only isClosed).
 *
 * Deliberately not `PartialType(CreateNotificationDto)`: this DTO also accepts
 * isClosed, which is not a creatable field — the server always starts it false.
 */
export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Header cannot be empty.' })
  @MaxLength(120)
  header?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Body cannot be empty.' })
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsEnum(Category, { message: 'Category must be one of INFO, WARNING or ERROR.' })
  category?: Category;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}
