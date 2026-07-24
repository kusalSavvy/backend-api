import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { AccountTypesService } from './account-types.service';
import { AccountTypeResponseDto } from './dto/account-type-response.dto';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';

@ApiTags('Account Types')
@Controller({
  path: 'account-types',
  version: '1',
})
export class AccountTypesController {
  constructor(private readonly accountTypesService: AccountTypesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an account type',
  })
  @ApiCreatedResponse({
    type: AccountTypeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
  })
  @ApiConflictResponse({
    description: 'Account type name already exists',
  })
  create(@Body() dto: CreateAccountTypeDto): Promise<AccountTypeResponseDto> {
    return this.accountTypesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all account types',
  })
  @ApiOkResponse({
    type: AccountTypeResponseDto,
    isArray: true,
  })
  findAll(): Promise<AccountTypeResponseDto[]> {
    return this.accountTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get account type by ID',
  })
  @ApiParam({
    name: 'id',
    example: '1',
  })
  @ApiOkResponse({
    type: AccountTypeResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID',
  })
  @ApiNotFoundResponse({
    description: 'Account type was not found',
  })
  findById(
    @Param('id', ParseBigIntPipe) id: bigint,
  ): Promise<AccountTypeResponseDto> {
    return this.accountTypesService.findById(id);
  }
}
