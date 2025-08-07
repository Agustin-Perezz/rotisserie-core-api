import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { createAccessToken } from '@/test/test.utils';

import { AppModule } from '../../app.module';

describe('UserController', () => {
  let app: INestApplication;
  let authToken: string;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: 'admin123',
      },
    });

    authToken = await createAccessToken({
      email: 'admin@gmail.com',
      sub: '1',
    });

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userDto = {
        email: 'testuser@example.com',
        password: 'TestPass123!',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: expect.any(Number),
            email: userDto.email,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('GET /users/:id', () => {
    let userId: string;

    it('should return a single user by id', async () => {
      const userDto = {
        email: 'singleuser@example.com',
        password: 'TestPass123!',
      };
      const res1 = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .set('Authorization', `Bearer ${authToken}`);
      userId = res1.body.id;

      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: userId,
            email: userDto.email,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('PATCH /users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const userDto = {
        email: 'updateuser@example.com',
        password: 'TestPass123!',
      };
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.CREATED);
      userId = res.body.id;
    });

    it('should update a user', async () => {
      const updateDto = { email: 'updateuser@example.com' };
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateDto)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: userId,
            email: updateDto.email,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('DELETE /users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const userDto = {
        email: 'deleteuser@example.com',
        password: 'TestPass123!',
      };
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.CREATED);
      userId = res.body.id;
    });

    it('should delete a user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);
    });
  });
});
