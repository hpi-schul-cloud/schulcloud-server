import { Module } from '@nestjs/common';
import { CourseRepo, LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { LtiToolSortingMapper } from '@shared/repo/ltitool/lti-tool-sorting.mapper';
import { LtiToolService } from '@src/modules/tool/service/lti-tool.service';
import { SchoolModule } from '@src/modules/school/school.module';
import { Lti11ResponseMapper } from './mapper/lti11-response.mapper';
import { LtiToolMapper } from './mapper/lti-tool.mapper';
import { LtiToolController } from './controller/lti-tool.controller';
import { ToolController } from './controller/tool.controller';
import { LtiToolUc } from './uc/lti-tool.uc';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { UserModule } from '../user';

@Module({
	controllers: [LtiToolController, ToolController],
	imports: [UserModule, LoggerModule, AuthorizationModule, SchoolModule],
	providers: [
		Lti11Service,
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolUc,
		LtiToolRepo,
		PseudonymsRepo,
		LtiToolMapper,
		LtiToolSortingMapper,
		LtiToolService,
		CourseRepo,
	],
	exports: [LtiToolRepo],
})
export class ToolModule {}
