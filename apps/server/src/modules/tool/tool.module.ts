import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { Lti11ResponseMapper } from '@src/modules/tool/mapper/lti11-response.mapper';
import { LoggerModule } from '@src/core/logger';
import { LtiToolService } from '@src/modules/tool/service/lti-tool.service';
import { SchoolService } from '@src/modules/school';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { UserModule } from '../user';

@Module({
	imports: [UserModule, LoggerModule],
	providers: [
		Lti11Service,
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolRepo,
		PseudonymsRepo,
		LtiToolService,
		SchoolService,
	],
})
export class ToolModule {}
