import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import request from 'supertest';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      signin(): string[];
    }
  }
}

jest.mock('../nats-wrapper');

let mongo: any;
beforeAll(async () => {
  process.env.JWT_KEY = 'asdfsds';
  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

export let globalWithSignin = global as typeof globalThis & {
  signin(): string[];
};
if (!globalWithSignin.signin) {
  globalWithSignin.signin = () => {
    // Build a JWT payload. {id, emai}
    const payload = {
      id: new mongoose.Types.ObjectId()._id,
      email: 'test@test.com',
    };
    // Create the JWT!
    const token = jwt.sign(payload, process.env.JWT_KEY!);
    // Build session object. { jwt: MY_JWT }
    const session = { jwt: token };
    // Turn that s ession into JSON
    const sessionJSON = JSON.stringify(session);
    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64');
    // return a string thats the cookie with the encoded data
    return [`session=${base64}`];
  };
}

// global.signin = async () => {
//   const email = 'test@test.com';
//   const password = 'password';

//   const response = await request(app)
//     .post('/api/users/signup')
//     .send({
//       email,
//       password,
//     })
//     .expect(201);

//   const cookie = response.get('Set-Cookie');

//   return cookie;
// };
