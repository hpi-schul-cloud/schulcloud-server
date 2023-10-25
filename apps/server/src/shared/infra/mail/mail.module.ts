import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { IMailConfig } from './interfaces/mail-config';

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
				ConfigService<IMailConfig, true>,
			],
			exports: [MailService],
		};
	}
}
