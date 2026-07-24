import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';

interface AccountTypeApiResponse {
  id: string;
  name: string;
  description: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAccountTypeApiResponse = (
  value: unknown,
): value is AccountTypeApiResponse => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string'
  );
};

describe('Account Types API E2E', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api');

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.accountType.deleteMany();
  });

  afterAll(async () => {
    await prisma.accountType.deleteMany();
    await app.close();
  });

  it('POST /api/v1/account-types creates an account type', async () => {
    const response = await request(httpServer)
      .post('/api/v1/account-types')
      .send({
        name: 'Person Account',
        description: 'Individual customer account',
      })
      .expect(201);

    const responseBody: unknown = response.body;

    expect(isAccountTypeApiResponse(responseBody)).toBe(true);

    if (!isAccountTypeApiResponse(responseBody)) {
      throw new Error('Unexpected account type response');
    }

    expect(responseBody.id).toEqual(expect.any(String));
    expect(responseBody.name).toBe('Person Account');
    expect(responseBody.description).toBe('Individual customer account');
  });

  it('GET /api/v1/account-types returns account types', async () => {
    await prisma.accountType.create({
      data: {
        name: 'Business Account',
        description: 'Business customer account',
      },
    });

    const response = await request(httpServer)
      .get('/api/v1/account-types')
      .expect(200);

    const responseBody: unknown = response.body;

    expect(Array.isArray(responseBody)).toBe(true);

    if (!Array.isArray(responseBody)) {
      throw new Error('Expected an array response');
    }

    expect(responseBody).toHaveLength(1);

    const firstAccountType: unknown = responseBody[0];

    expect(isAccountTypeApiResponse(firstAccountType)).toBe(true);

    if (!isAccountTypeApiResponse(firstAccountType)) {
      throw new Error('Unexpected account type response');
    }

    expect(firstAccountType.name).toBe('Business Account');
    expect(firstAccountType.description).toBe('Business customer account');
  });

  it('returns 400 when the name is empty', async () => {
    await request(httpServer)
      .post('/api/v1/account-types')
      .send({
        name: '   ',
        description: 'Invalid account type',
      })
      .expect(400);
  });

  it('returns 409 for a duplicate name', async () => {
    const payload = {
      name: 'Broker Partner',
      description: 'Broker partner account',
    };

    await request(httpServer)
      .post('/api/v1/account-types')
      .send(payload)
      .expect(201);

    await request(httpServer)
      .post('/api/v1/account-types')
      .send(payload)
      .expect(409);
  });

  it('returns 404 when the account type does not exist', async () => {
    await request(httpServer).get('/api/v1/account-types/999999').expect(404);
  });
});
