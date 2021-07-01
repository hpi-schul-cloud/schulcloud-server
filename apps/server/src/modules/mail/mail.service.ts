import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { Mail } from './entity/mail.entity';
import { exchange, routingKey } from './constants';

@Injectable()
export class MailService {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async send(mail: Mail) {
		return this.amqpConnection.publish(exchange, routingKey, mail);
	}
}
