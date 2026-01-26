export class CreateUserDto {
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
  status?: string;
}

// src/user/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
// import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
