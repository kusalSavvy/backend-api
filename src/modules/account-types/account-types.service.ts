import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { AccountTypeResponseDto } from './dto/account-type-response.dto';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';

type AccountTypeRecord = {
  id: bigint;
  name: string;
  description: string;
};

@Injectable()
export class AccountTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccountTypesService.name);
  }

  async create(
    dto: CreateAccountTypeDto,
  ): Promise<AccountTypeResponseDto> {
    this.logger.info(
      {
        accountTypeName: dto.name,
      },
      'Creating account type',
    );

    try {
      const accountType =
        await this.prisma.accountType.create({
          data: {
            name: dto.name,
            description: dto.description,
          },
        });

      this.logger.info(
        {
          accountTypeId: accountType.id.toString(),
          accountTypeName: accountType.name,
        },
        'Account type created successfully',
      );

      return this.toResponse(accountType);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        this.logger.warn(
          {
            accountTypeName: dto.name,
          },
          'Account type name already exists',
        );

        throw new ConflictException(
          `Account type '${dto.name}' already exists`,
        );
      }

      this.logger.error(
        {
          err: error,
          accountTypeName: dto.name,
        },
        'Failed to create account type',
      );

      throw error;
    }
  }

  async findAll(): Promise<AccountTypeResponseDto[]> {
    this.logger.debug(
      'Retrieving all account types',
    );

    const accountTypes =
      await this.prisma.accountType.findMany({
        orderBy: {
          name: 'asc',
        },
      });

    this.logger.debug(
      {
        recordCount: accountTypes.length,
      },
      'Account types retrieved successfully',
    );

    return accountTypes.map((accountType) =>
      this.toResponse(accountType),
    );
  }

  async findById(
    id: bigint,
  ): Promise<AccountTypeResponseDto> {
    this.logger.debug(
      {
        accountTypeId: id.toString(),
      },
      'Retrieving account type by ID',
    );

    const accountType =
      await this.prisma.accountType.findUnique({
        where: {
          id,
        },
      });

    if (!accountType) {
      this.logger.warn(
        {
          accountTypeId: id.toString(),
        },
        'Account type was not found',
      );

      throw new NotFoundException(
        `Account type with ID '${id.toString()}' was not found`,
      );
    }

    return this.toResponse(accountType);
  }

  private isUniqueConstraintError(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private toResponse(
    accountType: AccountTypeRecord,
  ): AccountTypeResponseDto {
    return {
      id: accountType.id.toString(),
      name: accountType.name,
      description: accountType.description,
    };
  }
}