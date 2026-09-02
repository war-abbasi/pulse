import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // @IsString() is doing security work here, not just type checking: it rejects
  // an object such as { $ne: null }, which is how the original Express API was
  // trivially bypassed. Combined with the global whitelist, nothing but a
  // string can reach the service.
  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
