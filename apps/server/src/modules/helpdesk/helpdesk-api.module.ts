import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { HelpdeskController, HelpdeskUc } from './api';
import { HelpdeskModule } from './helpdesk.module';

@Module({
	imports: [HelpdeskModule, AuthorizationModule, UserModule],
	controllers: [HelpdeskController],
	providers: [HelpdeskUc],
})
export class HelpdeskApiModule {}
