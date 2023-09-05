import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { SchoolModule } from '@src/modules/school-migration';
import { UserModule } from '@src/modules/user';
import { ToolContextController } from './context-external-tool/controller';
import { ContextExternalToolUc } from './context-external-tool/uc';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { ExternalToolConfigurationUc, ExternalToolUc, ToolReferenceUc } from './external-tool/uc';
import { ToolSchoolController } from './school-external-tool/controller';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from './school-external-tool/mapper';
import { SchoolExternalToolUc } from './school-external-tool/uc';
import { ToolConfigModule } from './tool-config.module';
import { ToolLaunchController } from './tool-launch/controller/tool-launch.controller';
import { ToolLaunchUc } from './tool-launch/uc';
import { ToolModule } from './tool.module';
import { ExternalToolConfigurationService } from './external-tool/service';
import { CommonToolModule } from './common';

@Module({
	imports: [
		ToolModule,
		CommonToolModule,
		UserModule,
		AuthorizationModule,
		LoggerModule,
		SchoolModule,
		ToolConfigModule,
	],
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
		ExternalToolConfigurationService,
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
