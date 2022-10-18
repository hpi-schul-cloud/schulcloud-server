import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { Lti11ResponseMapper } from './mapper/lti11-response.mapper';
import { LtiToolMapper } from './mapper/lti-tool.mapper';
import { LtiToolController } from './controller/lti-tool.controller';
import { ToolController } from './controller/tool.controller';
import { LtiToolUc } from './uc/lti-tool.uc';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { UserModule } from '../user';
import { LtiToolSortingMapper } from '@shared/repo/ltitool/lti-tool-sorting.mapper';

@Module({
	controllers: [LtiToolController, ToolController],
	imports: [UserModule, LoggerModule, AuthorizationModule],
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
	],
	exports: [LtiToolRepo],
})
export class ToolModule {}
