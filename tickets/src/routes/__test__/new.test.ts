import request from 'supertest';
import { app } from '../../app';
import { globalWithSignin } from '../../test/setup';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

describe('Ticket creation post', () => {
  it('has a route handler listening to /api/tickets for post request', async () => {
    const response = await request(app).post('/api/tickets').send({});

    expect(response.status).not.toEqual(404);
  });
  it('can only be accessed if the user is signed in', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({})
      .expect(401);
  });
  it('return a status other than 401 if the user is signed in', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });
  it('returns an error if an invalid title is provided', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: '',
        price: 19,
      })
      .expect(400);
    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        price: 19,
      })
      .expect(400);
  });
  it('returns an error if an invalid price is provided', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: 'dadawdadw',
        price: -10,
      })
      .expect(400);
    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: 'dadawdadw',
      })
      .expect(400);
  });
  it('creates a ticket with valid inputs', async () => {
    // add in a check to make sure a ticket was saved
    let tickets = await Ticket.find({});
    expect(tickets.length).toEqual(0);

    const title = 'adawdawd';

    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title,
        price: 20,
      })
      .expect(201);
    tickets = await Ticket.find({});
    expect(tickets.length).toEqual(1);
    expect(tickets[0].price).toEqual(20);
    expect(tickets[0].title).toEqual(title);
  });
  it('publishes an event', async () => {
    const title = 'adawdawd';

    await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title,
        price: 20,
      })
      .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
