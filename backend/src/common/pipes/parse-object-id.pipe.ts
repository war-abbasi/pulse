import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates that a route parameter is a well-formed Mongo ObjectId.
 *
 * Without this, `new Types.ObjectId('nonsense')` throws deep inside Mongoose
 * and surfaces as a 500. A malformed id is a client mistake, so it should be
 * a 400 — and the check belongs in one pipe rather than in every service.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`"${value}" is not a valid id.`);
    }
    return value;
  }
}
