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
import { ToolConfigurationController, ToolContextController, ToolController, ToolSchoolController } from './controller';
import { ToolModule } from './tool.module';
import {
	ContextExternalToolUc,
	ExternalToolConfigurationUc,
	ExternalToolUc,
	Lti11Uc,
	SchoolExternalToolUc,
} from './uc';
import { LtiRoleMapper } from './uc/mapper';

@Module({
	imports: [ToolModule, UserModule, AuthorizationModule, LoggerModule, SchoolModule],
	controllers: [ToolConfigurationController, ToolSchoolController, ToolContextController, ToolController],
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
		ContextExternalToolUc,
	],
})
export class ToolApiModule {}
