import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AccountModule } from '@modules/account';
import { ServerMailModule } from '@modules/serverDynamicModuleWrappers/server-mail.module';
import { Module } from '@nestjs/common';
import { HelpdeskService } from './domain';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from './helpdesk-config';

@Module({
	imports: [
		ServerMailModule,
		ConfigurationModule.register(HELPDESK_CONFIG_TOKEN, HelpdeskConfig),
		LoggerModule,
		AccountModule,
	],
	providers: [HelpdeskService],
	exports: [HelpdeskService],
})
export class HelpdeskModule {}
