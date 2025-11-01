import { AuthGuard } from '@auth/infrastructure/guard/auth.guard';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../../app.module';
import { OrderWithRelations } from '../domain/interfaces/order.repository';

class MockAuthGuard {
  constructor() {}

  canActivate() {
    return true;
  }
}

describe('OrderController', () => {
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

    await prisma.shop.create({
      data: {
        id: 'shop-1',
        name: 'Test Shop',
        location: 'Test Location',
        ownerId: '1',
      },
    });

    await prisma.item.create({
      data: {
        id: 'item-1',
        name: 'Test Item',
        price: 10.0,
        shopId: 'shop-1',
      },
    });

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.shop.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /orders', () => {
    it('should return a list of orders', async () => {
      const res = await request(app.getHttpServer()).get('/orders').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderDto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 2,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderDto)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: expect.any(String),
            shopId: orderDto.shopId,
            status: OrderStatus.PENDING,
            orderItems: expect.arrayContaining([
              expect.objectContaining({
                itemId: 'item-1',
                quantity: 2,
              }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('GET /orders/:id', () => {
    let orderId: string;

    it('should return a single order by id', async () => {
      const orderDto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      const res1 = await request(app.getHttpServer())
        .post('/orders')
        .send(orderDto);
      orderId = res1.body.id;

      await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: orderId,
            shopId: orderDto.shopId,
            status: OrderStatus.PENDING,
            orderItems: expect.arrayContaining([
              expect.objectContaining({
                itemId: 'item-1',
                quantity: 1,
              }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('GET /orders/shop/:shopId', () => {
    beforeEach(async () => {
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
    });

    it('should return orders by shop id', async () => {
      const orderDto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      await request(app.getHttpServer()).post('/orders').send(orderDto);

      await request(app.getHttpServer())
        .get('/orders/shop/shop-1')
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });

    it('should filter orders by status for a shop', async () => {
      const order1Dto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      const order2Dto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 2,
          },
        ],
      };

      const res1 = await request(app.getHttpServer())
        .post('/orders')
        .send(order1Dto);
      const order1Id = res1.body.id;

      await request(app.getHttpServer()).post('/orders').send(order2Dto);

      await request(app.getHttpServer())
        .patch(`/orders/${order1Id}`)
        .send({ status: OrderStatus.COMPLETED });

      const res = await request(app.getHttpServer())
        .get(`/orders/shop/shop-1?status=${OrderStatus.COMPLETED}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe(OrderStatus.COMPLETED);
      expect(res.body[0].id).toBe(order1Id);
      expect(res.body[0].shopId).toBe('shop-1');
    });

    it('should return all orders for a shop when no status filter is provided', async () => {
      const order1Dto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      const order2Dto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 2,
          },
        ],
      };

      await request(app.getHttpServer()).post('/orders').send(order1Dto);
      await request(app.getHttpServer()).post('/orders').send(order2Dto);

      const res = await request(app.getHttpServer())
        .get('/orders/shop/shop-1')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      (res.body as OrderWithRelations[]).forEach((order) => {
        expect(order.shopId).toBe('shop-1');
      });
    });
  });

  describe('PATCH /orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const orderDto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(orderDto)
        .expect(HttpStatus.CREATED);
      orderId = res.body.id;
    });

    it('should update an order status', async () => {
      const updateDto = { status: OrderStatus.COMPLETED };
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            id: orderId,
            status: updateDto.status,
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('DELETE /orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const orderDto = {
        shopId: 'shop-1',
        orderItems: [
          {
            itemId: 'item-1',
            quantity: 1,
          },
        ],
      };
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(orderDto)
        .expect(HttpStatus.CREATED);
      orderId = res.body.id;
    });

    it('should delete an order', async () => {
      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .expect(HttpStatus.OK);
    });
  });
});
