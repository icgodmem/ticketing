import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';
import { globalWithSignin } from '../../test/setup';
import { natsWrapper } from '../../nats-wrapper';

describe('Update a ticket test', () => {
  it('returns a 404 if the provided id does not exist', async () => {
    const id = new mongoose.Types.ObjectId();
    await request(app)
      .put(`/api/tickets/${id._id}`)
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: 'adadwad',
        price: 20,
      })
      .expect(404);
  });
  it('returns a 401 if the user is not authenticated', async () => {
    const id = new mongoose.Types.ObjectId();
    await request(app)
      .put(`/api/tickets/${id._id}`)
      .send({
        title: 'adadwad',
        price: 20,
      })
      .expect(401);
  });
  it('returns a 401 if the user does not own the ticket', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: 'asasdas',
        price: 20,
      });
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', globalWithSignin.signin())
      .send({
        title: 'awdawdawdaw',
        price: 1000,
      })
      .expect(401);
  });
  it('returns a 400 if the users provided an invalid title or price', async () => {
    const cookie = globalWithSignin.signin();

    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'asasdas',
        price: 20,
      });

    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: '',
        price: 20,
      })
      .expect(400);

    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'adawdawadw',
        price: -10,
      })
      .expect(400);
  });
  it('updates the ticket provided valid inputs', async () => {
    const cookie = globalWithSignin.signin();

    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'asasdas',
        price: 20,
      });
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new title',
        price: 100,
      })
      .expect(200);

    const ticketResponse = await request(app)
      .get(`/api/tickets/${response.body.id}`)
      .send();

    expect(ticketResponse.body.title).toEqual('new title');
    expect(ticketResponse.body.price).toEqual(100);
  });

  it('publishes an event', async () => {
    const cookie = globalWithSignin.signin();

    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'asasdas',
        price: 20,
      });
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new title',
        price: 100,
      })
      .expect(200);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
  it('rejects updates if the ticket is reserved', async () => {
    const cookie = globalWithSignin.signin();

    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'asasdas',
        price: 20,
      });

    const ticket = await Ticket.findById(response.body.id);
    ticket!.set({ orderId: new mongoose.Types.ObjectId().toString() });
    await ticket!.save();

    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new title',
        price: 100,
      })
      .expect(400);
  });
});
