import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { Configuration } from '@hpi-schul-cloud/commons';

import { Mail } from './interfaces/mail';

@Injectable()
export class MailService {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async send(data: Mail) {
		return this.amqpConnection.publish(
			Configuration.get('MAIL_SEND_EXCHANGE'),
			Configuration.get('MAIL_SEND_ROUTING_KEY'),
			data
		);
	}
}
