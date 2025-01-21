import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@core/logger';
import { LearnroomModule } from '../learnroom';
import { CommonToolModule } from './common';
import { ToolPermissionHelper } from './common/uc/tool-permission-helper';
import { ToolContextController, ToolDeepLinkController } from './context-external-tool/controller';
import { ToolReferenceController } from './context-external-tool/controller/tool-reference.controller';
import { ContextExternalToolUc, ToolReferenceUc } from './context-external-tool/uc';
import { ToolConfigurationController, ToolController } from './external-tool/controller';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './external-tool/mapper';
import { ExternalToolConfigurationService } from './external-tool/service';
import { ExternalToolConfigurationUc, ExternalToolUc } from './external-tool/uc';
import { ToolSchoolController } from './school-external-tool/controller';
import { SchoolExternalToolUc } from './school-external-tool/uc';
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
		LearnroomModule,
		BoardModule,
		BoardContextApiHelperModule,
		SchoolModule,
		UserLicenseModule,
		EncryptionModule,
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
		LtiToolRepo,
		ExternalToolUc,
		ExternalToolConfigurationUc,
		ExternalToolConfigurationService,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
		SchoolExternalToolUc,
		ContextExternalToolUc,
		ToolLaunchUc,
		ToolReferenceUc,
		ToolPermissionHelper,
	],
})
export class ToolApiModule {}
