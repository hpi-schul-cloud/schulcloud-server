import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { HelpdeskProblemService } from './domain';
import { HELPDESK_PROBLEM_REPO } from './domain/interface';
import { HelpdeskProblemMikroOrmRepo } from './repo';

@Module({
	imports: [AuthorizationModule, UserModule],
	providers: [HelpdeskProblemService, { provide: HELPDESK_PROBLEM_REPO, useClass: HelpdeskProblemMikroOrmRepo }],
	exports: [HelpdeskProblemService],
})
export class HelpdeskModule {}
