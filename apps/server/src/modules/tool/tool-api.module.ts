import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { UserModule } from '@modules/user';
import { CommonToolModule } from './common';
import { ToolContextController } from './context-external-tool/controller';
import { ToolReferenceController } from './context-external-tool/controller/tool-reference.controller';
import { ContextExternalToolUc, ToolReferenceUc } from './context-external-tool/uc';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { ExternalToolConfigurationService } from './external-tool/service';
import { ExternalToolConfigurationUc, ExternalToolUc } from './external-tool/uc';
import { ToolSchoolController } from './school-external-tool/controller';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from './school-external-tool/mapper';
import { SchoolExternalToolUc } from './school-external-tool/uc';
import { ToolConfigModule } from './tool-config.module';
import { ToolLaunchController } from './tool-launch/controller/tool-launch.controller';
import { ToolLaunchUc } from './tool-launch/uc';
import { ToolModule } from './tool.module';

@Module({
	imports: [
		ToolModule,
		CommonToolModule,
		UserModule,
		AuthorizationModule,
		LoggerModule,
		LegacySchoolModule,
		ToolConfigModule,
	],
	controllers: [
		ToolLaunchController,
		ToolConfigurationController,
		ToolSchoolController,
		ToolContextController,
		ToolReferenceController,
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
