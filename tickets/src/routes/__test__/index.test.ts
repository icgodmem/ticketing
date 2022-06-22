import request from 'supertest';
import { app } from '../../app';
import { globalWithSignin } from '../../test/setup';

const createTicket = () => {
  return request(app)
    .post('/api/tickets')
    .set('Cookie', globalWithSignin.signin())
    .send({
      title: 'dawdwad',
      price: 20,
    });
};

describe('Show all tickets', () => {
  it('can fetch a list of tickets', async () => {
    await createTicket();
    await createTicket();
    await createTicket();

    const response = await request(app).get('/api/tickets').send().expect(200);

    expect(response.body.length).toEqual(3);
  });
});
