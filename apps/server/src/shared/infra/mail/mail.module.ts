import { Module, DynamicModule } from '@nestjs/common';
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
			],
			exports: [MailService],
		};
	}
}
