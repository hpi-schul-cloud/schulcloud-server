import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

import { Mail } from './mail.interface';

interface MailServiceOptions {
	exchange: string;
	routingKey: string;
}

@Injectable()
export class MailService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('MAIL_SERVICE_OPTIONS') private readonly options: MailServiceOptions
	) {}

	public send(data: Mail): void {
		this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data, { persistent: true });
	}
}
