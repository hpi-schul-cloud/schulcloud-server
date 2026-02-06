import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { CourseModule } from '@modules/course';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { CommonToolModule } from './common';
import { ToolPermissionHelper } from './common/uc/tool-permission-helper';
import { ToolContextController, ToolDeepLinkController } from './context-external-tool/controller';
import { ToolReferenceController } from './context-external-tool/controller/tool-reference.controller';
import { ContextExternalToolUc, ToolReferenceUc } from './context-external-tool/uc';
import { TOOL_ENCRYPTION_CONFIG_TOKEN, ToolEncryptionConfig } from './encryption.config';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { ExternalToolConfigurationService } from './external-tool/service';
import { ExternalToolConfigurationUc, ExternalToolUc } from './external-tool/uc';
import { ToolSchoolController } from './school-external-tool/controller';
import { SchoolExternalToolUc } from './school-external-tool/uc';
import { TOOL_CONFIG_TOKEN, ToolConfig } from './tool-config';
import { ToolLaunchController } from './tool-launch/controller/tool-launch.controller';
import { ToolLaunchUc } from './tool-launch/uc';
import { ExternalToolUtilizationUc, SchoolExternalToolUtilizationUc } from './tool-utilization';
import { ExternalToolUtilizationModule } from './tool-utilization/tool-utilization.module';
import { ToolModule } from './tool.module';

@Module({
	imports: [
		ToolModule,
		CommonToolModule,
		UserModule,
		AuthorizationModule,
		LoggerModule,
		LegacySchoolModule,
		CourseModule,
		BoardModule,
		BoardContextApiHelperModule,
		SchoolModule,
		UserLicenseModule,
		SchoolLicenseModule,
		EncryptionModule.register(TOOL_ENCRYPTION_CONFIG_TOKEN, ToolEncryptionConfig),
		ExternalToolUtilizationModule,
		ConfigurationModule.register(TOOL_CONFIG_TOKEN, ToolConfig),
	],
	controllers: [
		ToolLaunchController,
		ToolConfigurationController,
		ToolSchoolController,
		ToolContextController,
		ToolReferenceController,
		ToolController,
		ToolDeepLinkController,
	],
	providers: [
		ExternalToolUc,
		ExternalToolUtilizationUc,
		ExternalToolConfigurationUc,
		ExternalToolConfigurationService,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
		SchoolExternalToolUc,
		SchoolExternalToolUtilizationUc,
		ContextExternalToolUc,
		ToolLaunchUc,
		ToolReferenceUc,
		ToolPermissionHelper,
	],
})
export class ToolApiModule {}
