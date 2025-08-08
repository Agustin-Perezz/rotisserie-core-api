import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AuthGuard } from '@/auth/infrastructure/guard/auth.guard';
import { PrismaModule } from '@/prisma/prisma.module';

import { AuthModule } from '../auth.module';

// Mock for AuthGuard
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

describe('AuthController', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, PrismaModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  describe('/auth/signup (POST)', () => {
    it('should register a user', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'test@gmail.com', firebaseUid: 'firebase-test-uid-1' })
        .expect(HttpStatus.CREATED);
    });

    it('should throw error if user already exists', async () => {
      await prisma.user.create({
        data: {
          id: 'duplicate-firebase-uid',
          email: 'duplicate@test.com',
        },
      });

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'duplicate@test.com',
          firebaseUid: 'duplicate-firebase-uid',
        })
        .expect(HttpStatus.CONFLICT)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            message: 'User already exists',
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });
});
