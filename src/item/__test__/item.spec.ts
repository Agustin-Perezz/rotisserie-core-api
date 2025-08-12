import { AuthGuard } from '@auth/infrastructure/guard/auth.guard';
import {
  ExecutionContext,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

class MockAuthGuard {
  constructor() {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'item-test-user', email: 'itemowner@example.com' };
    return true;
  }
}

describe('ItemController', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let userId: string;
  let shopId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    // Create test user
    await prisma.user.create({
      data: {
        id: 'item-test-user',
        email: 'itemowner@example.com',
      },
    });
    userId = 'item-test-user';

    // Create a test shop for the items
    const shop = await prisma.shop.create({
      data: {
        name: 'Test Shop for Items',
        description: 'A shop used for item tests',
        location: 'Test Location',
        ownerId: userId,
      },
    });
    shopId = shop.id;

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await prisma.item.deleteMany({});
    await prisma.shop.deleteMany({
      where: { id: shopId },
    });
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /items', () => {
    it('should return a list of items', async () => {
      const res = await request(app.getHttpServer()).get('/items').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return items for a specific shop', async () => {
      const res = await request(app.getHttpServer())
        .get(`/items?shopId=${shopId}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /items', () => {
    it('should create a new item', async () => {
      const itemDto = {
        name: 'Test Item',
        description: 'A test item description',
        price: 19.99,
        image: 'test-image-url.jpg',
        shopId: shopId,
      };

      await request(app.getHttpServer())
        .post('/items')
        .send(itemDto)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: expect.any(String),
            name: itemDto.name,
            description: itemDto.description,
            price: itemDto.price,
            image: itemDto.image,
            shopId: shopId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return an error if required fields are missing', async () => {
      const incompleteItemDto = {
        description: 'An incomplete item',
        // Missing required name and price
        shopId: shopId,
      };

      await request(app.getHttpServer())
        .post('/items')
        .send(incompleteItemDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /items/:id', () => {
    let itemId: string;

    it('should return a single item by id', async () => {
      // First create an item
      const itemDto = {
        name: 'Single Item',
        description: 'An item for single fetch test',
        price: 29.99,
        image: 'single-item-image.jpg',
        shopId: shopId,
      };

      const res1 = await request(app.getHttpServer())
        .post('/items')
        .send(itemDto);

      itemId = res1.body.id;

      await request(app.getHttpServer())
        .get(`/items/${itemId}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: itemId,
            name: itemDto.name,
            description: itemDto.description,
            price: itemDto.price,
            image: itemDto.image,
            shopId: shopId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/items/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /items/:id', () => {
    let itemId: string;

    beforeAll(async () => {
      const itemDto = {
        name: 'Update Item',
        description: 'An item for update test',
        price: 39.99,
        image: 'update-item-image.jpg',
        shopId: shopId,
      };

      const res = await request(app.getHttpServer())
        .post('/items')
        .send(itemDto)
        .expect(HttpStatus.CREATED);

      itemId = res.body.id;
    });

    it('should update an item', async () => {
      const updateDto = {
        name: 'Updated Item Name',
        price: 49.99,
      };

      await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: itemId,
            name: updateDto.name,
            price: updateDto.price,
            shopId: shopId,
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return 404 for updating a non-existent item', async () => {
      const updateDto = { name: 'This Will Fail' };

      await request(app.getHttpServer())
        .patch('/items/non-existent-id')
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /items/:id', () => {
    let itemId: string;

    beforeAll(async () => {
      const itemDto = {
        name: 'Delete Item',
        description: 'An item for delete test',
        price: 59.99,
        image: 'delete-item-image.jpg',
        shopId: shopId,
      };

      const res = await request(app.getHttpServer())
        .post('/items')
        .send(itemDto)
        .expect(HttpStatus.CREATED);

      itemId = res.body.id;
    });

    it('should delete an item', async () => {
      await request(app.getHttpServer())
        .delete(`/items/${itemId}`)
        .expect(HttpStatus.OK);

      // Verify the item was deleted
      await request(app.getHttpServer())
        .get(`/items/${itemId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for deleting a non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/items/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
