import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { UserModule } from '@src/modules/user';
import { SchoolModule } from '@src/modules/school';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './uc/mapper';
import { ToolController } from './controller/tool.controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper, Lti11ResponseMapper } from './controller/mapper';
import { ExternalToolUc } from './uc/external-tool.uc';
import { ToolModule } from './tool.module';
import { ToolSchoolController } from './controller/tool-school.controller';
import { SchoolExternalToolResponseMapper } from './controller/mapper/school-external-tool-response.mapper';
import { SchoolExternalToolUc } from './uc/school-external-tool.uc';
import { ToolConfigurationController } from './controller/tool-configuration.controller';
import { ExternalToolConfigurationUc } from './uc/external-tool-configuration.uc';

@Module({
	imports: [ToolModule, UserModule, AuthorizationModule, LoggerModule, SchoolModule],
	controllers: [ToolConfigurationController, ToolSchoolController, ToolController],
	providers: [
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolRepo,
		ExternalToolUc,
		ExternalToolConfigurationUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
		SchoolExternalToolUc,
		SchoolExternalToolResponseMapper,
	],
})
export class ToolApiModule {}
