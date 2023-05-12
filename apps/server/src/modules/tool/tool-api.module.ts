import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserModule } from '@src/modules/user';
import { SchoolModule } from '@src/modules/school';
import { ToolModule } from './tool.module';
import {
	SchoolExternalToolRequestMapper,
	SchoolExternalToolResponseMapper,
} from './school-external-tool/controller/mapper';
import { Lti11Uc, ToolLaunchUc } from './launch-tool/uc';
import {
	ExternalToolRequestMapper,
	ExternalToolResponseMapper,
	Lti11ResponseMapper,
} from './external-tool/controller/mapper';
import { ToolSchoolController } from './school-external-tool/controller';
import { LtiRoleMapper } from './launch-tool/mapper';
import { ExternalToolConfigurationUc, ExternalToolUc } from './external-tool/uc';
import { ContextExternalToolUc } from './context-external-tool/uc';
import { ToolContextController } from './context-external-tool/controller';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { SchoolExternalToolUc } from './school-external-tool/uc';
import { ToolLaunchController } from './launch-tool/controller';

@Module({
	imports: [ToolModule, UserModule, AuthorizationModule, LoggerModule, SchoolModule],
	controllers: [
		ToolLaunchController,
		ToolConfigurationController,
		ToolSchoolController,
		ToolContextController,
		ToolController,
	],
	providers: [
		ContextExternalToolUc,
		ExternalToolConfigurationUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
		ExternalToolUc,
		Lti11ResponseMapper,
		Lti11Uc,
		LtiRoleMapper,
		LtiToolRepo,
		SchoolExternalToolRequestMapper,
		SchoolExternalToolResponseMapper,
		SchoolExternalToolUc,
		ToolLaunchUc,
	],
})
export class ToolApiModule {}
