import { ApiProperty } from '@nestjs/swagger';

export class AccountTypeResponseDto {
  @ApiProperty({
    example: '1',
    description:
      'Account type BIGINT identifier returned as a string',
  })
  id!: string;

  @ApiProperty({
    example: 'Person Account',
  })
  name!: string;

  @ApiProperty({
    example: 'Individual customer account',
  })
  description!: string;
}