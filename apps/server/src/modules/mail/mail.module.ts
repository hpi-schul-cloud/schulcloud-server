import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Configuration } from '@hpi-schul-cloud/commons';

import { MailService } from './mail.service';
import { MailController } from './controller/mail.controller';

@Module({
	imports: [
		ClientsModule.register([
			{
				name: 'MAIL_MODULE',
				transport: Transport.RMQ,
				options: {
					urls: [Configuration.get('RABBITMQ_URI')],
					queue: Configuration.get('MAIL_SEND_QUEUE_NAME'),
					queueOptions: {
						durable: false,
					},
				},
			},
		]),
	],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule {}
