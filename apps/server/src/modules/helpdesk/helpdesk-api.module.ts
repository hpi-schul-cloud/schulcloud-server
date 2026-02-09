import { ConfigurationModule } from '@infra/configuration';
import { AccountModule } from '@modules/account';
import { AuthorizationModule } from '@modules/authorization';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { HelpdeskController, HelpdeskUc } from './api';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from './helpdesk-config';
import { HelpdeskModule } from './helpdesk.module';

@Module({
	imports: [
		HelpdeskModule,
		AuthorizationModule,
		SchoolModule,
		AccountModule,
		ConfigurationModule.register(HELPDESK_CONFIG_TOKEN, HelpdeskConfig),
	],
	controllers: [HelpdeskController],
	providers: [HelpdeskUc],
})
export class HelpdeskApiModule {}
