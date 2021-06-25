import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { exchange, rabbitMqUri } from './constants';

@Module({
	imports: [
		RabbitMQModule.forRoot(RabbitMQModule, {
			exchanges: [
				{
					name: exchange,
					type: 'direct',
				},
			],
			uri: rabbitMqUri,
		}),
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
