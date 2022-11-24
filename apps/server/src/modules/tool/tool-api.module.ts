import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school';
import { AuthorizationModule } from '@src/modules/authorization';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { UserModule } from '../user';
import { ToolController } from './controller/tool.controller';
import { Lti11ResponseMapper } from './mapper/lti11-response.mapper';
import { ExternalToolUc } from './uc/external-tool.uc';
import { ExternalToolRequestMapper } from './mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from './mapper/external-tool-response.mapper';
import { ToolModule } from './tool.module';
import { LoggerModule } from '../../core/logger';

@Module({
	imports: [
		ToolModule,
		UserModule,
		SchoolModule,
		AuthorizationModule,
		OauthProviderServiceModule,
		EncryptionModule,
		LoggerModule,
	],
	controllers: [ToolController],
	providers: [
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolRepo,
		ExternalToolUc,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
	],
})
export class ToolApiModule {}
