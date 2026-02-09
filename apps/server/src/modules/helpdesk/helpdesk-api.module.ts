import { AuthorizationModule } from '@modules/authorization';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { HelpdeskController, HelpdeskUc } from './api';
import { HelpdeskModule } from './helpdesk.module';
import { ConfigurationModule } from '@infra/configuration';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from './helpdesk-config';

@Module({
	imports: [
		HelpdeskModule,
		AuthorizationModule,
		SchoolModule,
		ConfigurationModule.register(HELPDESK_CONFIG_TOKEN, HelpdeskConfig),
	],
	controllers: [HelpdeskController],
	providers: [HelpdeskUc],
})
export class HelpdeskApiModule {}
