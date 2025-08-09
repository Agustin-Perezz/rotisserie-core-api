import { AuthGuard } from '@auth/infrastructure/guard/auth.guard';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

class MockAuthGuard {
  constructor() {}

  canActivate() {
    return true;
  }
}

describe('UserController', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    await prisma.user.create({
      data: {
        id: '1',
        email: 'admin@gmail.com',
      },
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
      const res = await request(app.getHttpServer()).get('/users').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userDto = {
        id: '2',
        email: 'testuser@example.com',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: userDto.id,
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
        id: '3',
        email: 'singleuser@example.com',
      };
      const res1 = await request(app.getHttpServer())
        .post('/users')
        .send(userDto);
      userId = res1.body.id;

      await request(app.getHttpServer())
        .get(`/users/${userId}`)
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
        id: '4',
        email: 'updateuser@example.com',
      };
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(HttpStatus.CREATED);
      userId = res.body.id;
    });

    it('should update a user', async () => {
      const updateDto = { email: 'updateuser@example.com' };
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateDto)
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
        id: '5',
        email: 'deleteuser@example.com',
      };
      const res = await request(app.getHttpServer())
        .post('/users')
        .send(userDto)
        .expect(HttpStatus.CREATED);
      userId = res.body.id;
    });

    it('should delete a user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(HttpStatus.OK);
    });
  });
});
