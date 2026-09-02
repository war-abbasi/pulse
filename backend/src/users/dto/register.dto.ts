import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required.' })
  @MaxLength(100)
  fullName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  // The assignment requires "no spaces". \S+ anchored end to end is the
  // simplest expression of that.
  @Matches(/^\S+$/, { message: 'Username must not contain spaces.' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  // bcrypt silently ignores anything past 72 bytes, so a 200-character
  // password would only have its first 72 bytes checked. Rejecting longer
  // input is clearer than accepting it and quietly truncating.
  @MaxLength(72)
  password: string;
}
