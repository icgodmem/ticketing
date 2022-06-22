import {
  Subjects,
  Publisher,
  ExpirationCompleteEvent,
} from '@jmmstickets/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
