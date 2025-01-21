// Tests unitaires

import { InMemoryWebinarRepository } from "../adapters/webinar-repository.in-memory";
import { ChangeSeats } from "./change-seats";
import { OrganizeWebinars } from "./organize-webinar";
import { testUser } from "src/users/tests/user-seeds";
import { Webinar } from "../entities/webinar.entity";
import { WebinarNotFoundException } from "../exceptions/webinar-not-found";
describe('Feature : Change seats', () => {
  // Initialisation de nos tests, boilerplates...
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }


  async function thenUpdatedWebinarSeatsShouldBe(seats: number): Promise<void> {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(seats);
  }
  async function whenUserChangeSeatsWith(payload: any) {
    await useCase.execute(payload)
  }

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  describe('Scenario: Happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    // Code commun à notre scénario : payload...
    it('should change the number of seats for a webinar', async () => {
      // ACT
      await whenUserChangeSeatsWith(payload);
      // ASSERT
      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });
  describe('Scenario: webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id2',
      seats: 200,
    };
    it('should fail', async () => {
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow(WebinarNotFoundException)
      expectWebinarToRemainUnchanged();
    });
  });


});