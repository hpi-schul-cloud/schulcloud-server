import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolModule } from '@src/modules/school';
import { UserModule } from '@src/modules/user';
import { ToolLaunchController } from './tool-launch/controller/tool-launch.controller';
import { ToolModule } from './tool.module';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { ToolSchoolController } from './school-external-tool/controller';
import { ToolContextController } from './context-external-tool/controller';
import { ExternalToolConfigurationUc, ExternalToolUc, ToolReferenceUc } from './external-tool/uc';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { SchoolExternalToolUc } from './school-external-tool/uc';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from './school-external-tool/mapper';
import { ContextExternalToolUc } from './context-external-tool/uc';
import { ToolLaunchUc } from './tool-launch/uc';

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
		ToolReferenceUc,
	],
})
export class ToolApiModule {}
