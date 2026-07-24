import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;

  if (typeof input === 'string') {
    return input.trim();
  }

  return input;
};

export class CreateAccountTypeDto {
  @ApiProperty({
    example: 'Person Account',
    description: 'Unique account type name',
    maxLength: 255,
  })
  @Transform(trimString)
  @IsString({
    message: 'name must be a string',
  })
  @IsNotEmpty({
    message: 'name is required',
  })
  @MaxLength(255, {
    message: 'name must not exceed 255 characters',
  })
  name!: string;

  @ApiProperty({
    example: 'Individual customer account',
    description: 'Account type description',
    maxLength: 255,
  })
  @Transform(trimString)
  @IsString({
    message: 'description must be a string',
  })
  @IsNotEmpty({
    message: 'description is required',
  })
  @MaxLength(255, {
    message: 'description must not exceed 255 characters',
  })
  description!: string;
}
