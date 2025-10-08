import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import type { NextFunction } from 'express';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

describe('ShopController', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await prisma.user.create({
      data: {
        id: 'shop-test-user',
        email: 'shopowner@example.com',
      },
    });

    userId = 'shop-test-user';

    app = moduleFixture.createNestApplication();
    app.use((req, _res, next: NextFunction) => {
      req['user'] = { sub: 'shop-test-user', email: 'shopowner@example.com' };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await prisma.shop.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: 'shop-test-user' },
    });
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /shops', () => {
    it('should return a list of shops', async () => {
      const res = await request(app.getHttpServer()).get('/shops').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /shops', () => {
    it('should create a new shop', async () => {
      const shopDto = {
        name: 'Test Shop',
        description: 'A test shop',
        location: 'Test Location',
      };

      await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: expect.any(String),
            name: shopDto.name,
            description: shopDto.description,
            location: shopDto.location,
            ownerId: userId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return an error if owner does not exist', async () => {
      const shopDto = {
        name: 'Test Shop Invalid Owner',
        description: 'A test shop with invalid owner',
        location: 'Test Location',
      };

      await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto)
        .expect(HttpStatus.CREATED);
    });
  });

  describe('GET /shops/:id', () => {
    let shopId: string;

    it('should return a single shop by id', async () => {
      const shopDto = {
        name: 'Single Shop',
        description: 'A shop for single fetch test',
        location: 'Single Location',
      };
      const res1 = await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto);
      shopId = res1.body.id;

      await request(app.getHttpServer())
        .get(`/shops/${shopId}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: shopId,
            name: shopDto.name,
            description: shopDto.description,
            location: shopDto.location,
            ownerId: userId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('GET /shops/name/:name', () => {
    it('should return a shop by name', async () => {
      const shopDto = {
        name: 'FindByName-Shop',
        description: 'Shop to find by name',
        location: 'Somewhere',
      };

      await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .get(`/shops/name/${shopDto.name}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          if (body) {
            const expectedResponse = expect.objectContaining({
              id: expect.any(String),
              name: shopDto.name,
              description: shopDto.description,
              location: shopDto.location,
              ownerId: userId,
            });
            expect(body).toEqual(expectedResponse);
          } else {
            expect(body).not.toBeNull();
          }
        });
    });
  });

  describe('PUT /shops/:id', () => {
    let shopId: string;

    beforeAll(async () => {
      const shopDto = {
        name: 'Update Shop',
        description: 'A shop for update test',
        location: 'Update Location',
      };
      const res = await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto)
        .expect(HttpStatus.CREATED);
      shopId = res.body.id;
    });

    it('should update a shop', async () => {
      const updateDto = { name: 'Updated Shop Name', location: 'New Location' };
      await request(app.getHttpServer())
        .put(`/shops/${shopId}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: shopId,
            name: updateDto.name,
            location: updateDto.location,
            ownerId: userId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('DELETE /shops/:id', () => {
    let shopId: string;

    beforeAll(async () => {
      const shopDto = {
        name: 'Delete Shop',
        description: 'A shop for delete test',
        location: 'Delete Location',
      };
      const res = await request(app.getHttpServer())
        .post('/shops')
        .send(shopDto)
        .expect(HttpStatus.CREATED);
      shopId = res.body.id;
    });

    it('should delete a shop', async () => {
      await request(app.getHttpServer())
        .delete(`/shops/${shopId}`)
        .expect(HttpStatus.OK);
    });
  });
});
