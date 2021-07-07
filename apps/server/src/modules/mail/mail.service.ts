import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { Mail } from './interfaces/mail';
import { Inject } from '@nestjs/common';

@Injectable()
export class MailService {
	constructor(private readonly amqpConnection: AmqpConnection,  @Inject('MAIL_SERVICE_OPTIONS') private readonly options: { exchange: string, routingKey: string }) {}

	public async send(data: Mail) {
		return this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data);
	}
}
