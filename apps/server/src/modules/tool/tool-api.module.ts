import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserModule } from '@src/modules/user';
import { SchoolModule } from '@src/modules/school';
import {
	ExternalToolRequestMapper,
	ExternalToolResponseMapper,
	Lti11ResponseMapper,
	SchoolExternalToolRequestMapper,
	SchoolExternalToolResponseMapper,
} from './controller/mapper';
import { ToolConfigurationController } from './controller/tool-configuration.controller';
import { ToolController } from './controller/tool.controller';
import { ToolModule } from './tool.module';
import { ExternalToolUc } from './uc/external-tool.uc';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './uc/mapper';
import { ExternalToolConfigurationUc } from './uc/external-tool-configuration.uc';
import { ToolSchoolController } from './controller/tool-school.controller';
import { SchoolExternalToolUc } from './uc/school-external-tool.uc';

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
		SchoolExternalToolRequestMapper,
	],
})
export class ToolApiModule {}
