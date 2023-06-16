import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolModule } from '@src/modules/school';
import { UserModule } from '@src/modules/user';
import { ToolConfigurationController, ToolContextController, ToolController, ToolSchoolController } from './controller';
import {
	ExternalToolRequestMapper,
	ExternalToolResponseMapper,
	SchoolExternalToolRequestMapper,
	SchoolExternalToolResponseMapper,
} from './controller/mapper';
import { ToolLaunchController } from './launch-tool/controller/tool-launch.controller';
import { ToolLaunchUc } from './launch-tool/uc/tool-launch.uc';
import { ToolModule } from './tool.module';
import { ContextExternalToolUc, ExternalToolConfigurationUc, ExternalToolUc, SchoolExternalToolUc } from './uc';

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
		LtiToolRepo,
		ExternalToolUc,
		ExternalToolConfigurationUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
		SchoolExternalToolUc,
		SchoolExternalToolResponseMapper,
		SchoolExternalToolRequestMapper,
		ContextExternalToolUc,
		ToolLaunchUc,
	],
})
export class ToolApiModule {}
