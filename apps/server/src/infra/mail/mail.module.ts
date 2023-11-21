import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailConfig } from './interfaces/mail-config';
import { MailService } from './mail.service';

interface MailModuleOptions {
	exchange: string;
	routingKey: string;
}

@Module({})
export class MailModule {
	static forRoot(options: MailModuleOptions): DynamicModule {
		return {
			module: MailModule,
			providers: [
				MailService,
				{
					provide: 'MAIL_SERVICE_OPTIONS',
					useValue: { exchange: options.exchange, routingKey: options.routingKey },
				},
				ConfigService<MailConfig, true>,
			],
			exports: [MailService],
		};
	}
}
