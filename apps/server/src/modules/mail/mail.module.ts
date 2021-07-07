import { Module, DynamicModule } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { MailService } from './mail.service';

interface MailModuleOptions {
	uri: string;
	exchange: string;
	routingKey: string;
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
