import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { UserModule } from '../user/user.module';
import { CommonToolModule } from './common/common-tool.module';
import { ToolContextController } from './context-external-tool/controller/tool-context.controller';
import { ToolReferenceController } from './context-external-tool/controller/tool-reference.controller';
import { ContextExternalToolUc } from './context-external-tool/uc/context-external-tool.uc';
import { ToolReferenceUc } from './context-external-tool/uc/tool-reference.uc';
import { ToolConfigurationController } from './external-tool/controller/tool-configuration.controller';
import { ToolController } from './external-tool/controller/tool.controller';
import { ExternalToolRequestMapper } from './external-tool/mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from './external-tool/mapper/external-tool-response.mapper';
import { ExternalToolConfigurationService } from './external-tool/service/external-tool-configuration.service';
import { ExternalToolConfigurationUc } from './external-tool/uc/external-tool-configuration.uc';
import { ExternalToolUc } from './external-tool/uc/external-tool.uc';
import { ToolSchoolController } from './school-external-tool/controller/tool-school.controller';
import { SchoolExternalToolRequestMapper } from './school-external-tool/mapper/school-external-tool-request.mapper';
import { SchoolExternalToolResponseMapper } from './school-external-tool/mapper/school-external-tool-response.mapper';
import { SchoolExternalToolUc } from './school-external-tool/uc/school-external-tool.uc';
import { ToolConfigModule } from './tool-config.module';
import { ToolLaunchController } from './tool-launch/controller/tool-launch.controller';
import { ToolLaunchUc } from './tool-launch/uc/tool-launch.uc';
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
