import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule } from '@nestjs/common';

interface MailModuleOptions {
    uri: string,
    exchange: string,
    routingKey: string,
}

type RabbitMqModuleOptions = Omit<MailModuleOptions, 'routingKey'>;

const createRabbitMqModule = (options: RabbitMqModuleOptions) => {
	const rabbitMqModule = RabbitMQModule.forRoot(RabbitMQModule, {
		exchanges: [
			{
				name: options.exchange,
				type: 'direct',
			},
		],
		uri: options.uri,
	});
	return rabbitMqModule;
};

@Module({})
export class MailModule {
	static forRoot(options: MailModuleOptions): DynamicModule {
		return {
			module: MailModule,
			imports: [createRabbitMqModule(options)],
			providers: [
				MailService,
				{
					provide: 'MAIL_SERVICE_OPTIONS',
					useValue: { exchange: options.exchange, routingKey: options.routingKey },
				},
			],
			exports: [MailService],
		};
	}
}
