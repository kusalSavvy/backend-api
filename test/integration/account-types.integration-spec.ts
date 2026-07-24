import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import { AccountTypesService } from '../../src/modules/account-types/account-types.service';

describe('AccountTypesService integration', () => {
  let moduleRef: TestingModule;
  let service: AccountTypesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();

    service = moduleRef.get(AccountTypesService);
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.accountType.deleteMany();
  });

  afterAll(async () => {
    await prisma.accountType.deleteMany();
    await moduleRef.close();
  });

  it('should save an account type in PostgreSQL', async () => {
    const result = await service.create({
      name: 'Person Account',
      description: 'Individual customer account',
    });

    const savedRecord = await prisma.accountType.findUnique({
      where: {
        name: 'Person Account',
      },
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Person Account');
    expect(result.description).toBe('Individual customer account');

    expect(savedRecord).not.toBeNull();
    expect(savedRecord?.name).toBe('Person Account');
    expect(savedRecord?.description).toBe('Individual customer account');
  });

  it('should retrieve account types from PostgreSQL', async () => {
    await prisma.accountType.createMany({
      data: [
        {
          name: 'Person Account',
          description: 'Individual customer account',
        },
        {
          name: 'Business Account',
          description: 'Business customer account',
        },
      ],
    });

    const result = await service.findAll();

    expect(result).toHaveLength(2);

    expect(result.map((accountType) => accountType.name)).toEqual(
      expect.arrayContaining(['Person Account', 'Business Account']),
    );
  });

  it('should reject a duplicate account type name', async () => {
    const accountType = {
      name: 'Broker Partner',
      description: 'Broker partner account',
    };

    await service.create(accountType);

    await expect(service.create(accountType)).rejects.toBeInstanceOf(
      ConflictException,
    );

    const records = await prisma.accountType.findMany({
      where: {
        name: 'Broker Partner',
      },
    });

    expect(records).toHaveLength(1);
  });
});
