import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Category } from '../enums/category.enum.js';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Header is required.' })
  @MaxLength(120)
  header: string;

  @IsString()
  @IsNotEmpty({ message: 'Body is required.' })
  @MaxLength(2000)
  body: string;

  @IsEnum(Category, { message: 'Category must be one of INFO, WARNING or ERROR.' })
  category: Category;
}
