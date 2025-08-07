import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { PrismaModule } from '@/prisma/prisma.module';

import { AuthModule } from '../auth.module';

describe('AuthController', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, PrismaModule],
    }).compile();

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
        .send({ email: 'test@gmail.com', password: 'test' })
        .expect(HttpStatus.CREATED);
    });
    it('should throw error if user already exists', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@test.com',
          password: 'password123',
        },
      });
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'duplicate@test.com', password: 'password123' })
        .expect(HttpStatus.CONFLICT)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            message: 'User already exists',
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should return access_token for valid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'test@gmail.com', password: 'test' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            access_token: expect.any(String),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return 401 for invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'test@gmail.com', password: 'wrong' })
        .expect(HttpStatus.UNAUTHORIZED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            message: 'Invalid credentials',
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });
});
