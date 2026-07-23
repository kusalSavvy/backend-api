import {
  Transform,
  TransformFnParams,
} from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountTypeDto {
  @ApiProperty({
    example: 'Person Account',
    maxLength: 255,
  })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty({
    message: 'name must not be empty',
  })
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'Person Account',
    maxLength: 255,
  })
  @Transform(({ value }: TransformFnParams) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty({
    message: 'description must not be empty',
  })
  @MaxLength(255)
  description!: string;
}