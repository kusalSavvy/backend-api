import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { AccountTypesService } from './account-types.service';

describe('AccountTypesService', () => {
  let service: AccountTypesService;

  const prismaMock = {
    accountType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const loggerMock = {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AccountTypesService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
          {
            provide: PinoLogger,
            useValue: loggerMock,
          },
        ],
      }).compile();

    service = module.get<AccountTypesService>(
      AccountTypesService,
    );
  });

  describe('service creation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should set the logger context', () => {
      expect(loggerMock.setContext).toHaveBeenCalledWith(
        AccountTypesService.name,
      );
    });
  });

  describe('create', () => {
    it('should create and return an account type', async () => {
      const dto = {
        name: 'Person Account',
        description: 'Individual customer account',
      };

      prismaMock.accountType.create.mockResolvedValue({
        id: 1n,
        name: dto.name,
        description: dto.description,
      });

      const result = await service.create(dto);

      expect(
        prismaMock.accountType.create,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.accountType.create,
      ).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      expect(result).toEqual({
        id: '1',
        name: dto.name,
        description: dto.description,
      });
    });

    it('should convert a BIGINT ID to a string', async () => {
      const dto = {
        name: 'Business Account',
        description: 'Business customer account',
      };

      prismaMock.accountType.create.mockResolvedValue({
        id: 9_223_372_036_854_775_807n,
        name: dto.name,
        description: dto.description,
      });

      const result = await service.create(dto);

      expect(result.id).toBe(
        '9223372036854775807',
      );
    });

    it('should throw ConflictException when the name already exists', async () => {
      const dto = {
        name: 'Person Account',
        description: 'Individual customer account',
      };

      const prismaError =
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: 'test',
            meta: {
              modelName: 'AccountType',
              target: ['name'],
            },
          },
        );

      prismaMock.accountType.create.mockRejectedValue(
        prismaError,
      );

      const action = service.create(dto);

      await expect(action).rejects.toBeInstanceOf(
        ConflictException,
      );

      await expect(action).rejects.toMatchObject({
        status: 409,
        message:
          "Account type 'Person Account' already exists",
      });

      expect(
        prismaMock.accountType.create,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.accountType.create,
      ).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('should rethrow an unexpected database error', async () => {
      const dto = {
        name: 'Broker Partner',
        description: 'Broker partner account',
      };

      const databaseError = new Error(
        'Database connection failed',
      );

      prismaMock.accountType.create.mockRejectedValue(
        databaseError,
      );

      await expect(
        service.create(dto),
      ).rejects.toThrow(
        'Database connection failed',
      );

      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all account types', async () => {
      prismaMock.accountType.findMany.mockResolvedValue([
        {
          id: 1n,
          name: 'Business Account',
          description: 'Business customer account',
        },
        {
          id: 2n,
          name: 'Person Account',
          description: 'Individual customer account',
        },
      ]);

      const result = await service.findAll();

      expect(
        prismaMock.accountType.findMany,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.accountType.findMany,
      ).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });

      expect(result).toEqual([
        {
          id: '1',
          name: 'Business Account',
          description: 'Business customer account',
        },
        {
          id: '2',
          name: 'Person Account',
          description: 'Individual customer account',
        },
      ]);
    });

    it('should return an empty array when no account types exist', async () => {
      prismaMock.accountType.findMany.mockResolvedValue(
        [],
      );

      const result = await service.findAll();

      expect(result).toEqual([]);

      expect(
        prismaMock.accountType.findMany,
      ).toHaveBeenCalledTimes(1);
    });

    it('should rethrow an unexpected findAll database error', async () => {
      prismaMock.accountType.findMany.mockRejectedValue(
        new Error('Failed to retrieve account types'),
      );

      await expect(
        service.findAll(),
      ).rejects.toThrow(
        'Failed to retrieve account types',
      );
    });
  });

  describe('findById', () => {
    it('should return an account type by ID', async () => {
      prismaMock.accountType.findUnique.mockResolvedValue({
        id: 1n,
        name: 'Person Account',
        description: 'Individual customer account',
      });

      const result = await service.findById(1n);

      expect(
        prismaMock.accountType.findUnique,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.accountType.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 1n,
        },
      });

      expect(result).toEqual({
        id: '1',
        name: 'Person Account',
        description: 'Individual customer account',
      });
    });

    it('should throw NotFoundException when the account type does not exist', async () => {
      prismaMock.accountType.findUnique.mockResolvedValue(
        null,
      );

      const action = service.findById(999n);

      await expect(action).rejects.toBeInstanceOf(
        NotFoundException,
      );

      await expect(action).rejects.toMatchObject({
        status: 404,
        message:
          "Account type with ID '999' was not found",
      });

      expect(
        prismaMock.accountType.findUnique,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.accountType.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 999n,
        },
      });
    });

    it('should rethrow an unexpected findById database error', async () => {
      prismaMock.accountType.findUnique.mockRejectedValue(
        new Error('Database query failed'),
      );

      await expect(
        service.findById(1n),
      ).rejects.toThrow('Database query failed');
    });
  });
});