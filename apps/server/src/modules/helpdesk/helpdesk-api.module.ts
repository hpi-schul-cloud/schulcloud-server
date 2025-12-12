import { AuthorizationModule } from '@modules/authorization';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { HelpdeskController, HelpdeskUc } from './api';
import { HelpdeskModule } from './helpdesk.module';

@Module({
	imports: [HelpdeskModule, AuthorizationModule, SchoolModule],
	controllers: [HelpdeskController],
	providers: [HelpdeskUc],
})
export class HelpdeskApiModule {}
