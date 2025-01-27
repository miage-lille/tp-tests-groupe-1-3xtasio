import supertest from 'supertest';
import { TestServerFixture } from './tests/fixtures';
import { WebinarNotFoundException } from './webinars/exceptions/webinar-not-found';

describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  describe('Scenario : Happy path', () => {
    it('should update webinar seats', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'test-user',
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: '30' })
        .expect(200);

      // ASSERT
      expect(response.body).toEqual({ message: 'Seats updated' });

      const updatedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(updatedWebinar?.seats).toBe(30);
    });
  });

  describe('Scenario: webinar does not exist', () => {
    it('should return 404 and error message', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'webinar-id2',
          organizerId: 'organizer-id2',
          title: 'Webinar2',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 100,
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/unknownId/seats`)
        .send({ seats: '200' })
        .expect(404);

      // ASSERT
      expect(response.body).toEqual({
        error: 'Webinar not found',
      });

      const initialWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(initialWebinar?.seats).toBe(100);
    });
  });

  describe('Scenario: update webinar of another owner', () => {
    it('should return 401 and error message', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'webinar-id2',
          organizerId: 'organizer-id2',
          title: 'Webinar2',
          startDate: new Date('2022-01-01T00:00:00Z'),
          endDate: new Date('2022-01-01T01:00:00Z'),
          seats: 100,
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: '200' })
        .expect(401);

      // ASSERT
      expect(response.body).toEqual({
        error: 'User is not allowed to update this webinar',
      });

      const initialWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(initialWebinar?.seats).toBe(100);
    });
  });
});
