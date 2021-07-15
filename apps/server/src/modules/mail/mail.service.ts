import { Injectable, Inject } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

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

	public async send(data: Mail): Promise<void> {
		await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, data);
	}
}
