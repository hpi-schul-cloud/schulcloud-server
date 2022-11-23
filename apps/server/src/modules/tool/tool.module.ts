import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { UserModule } from '../user';
import { ToolController } from './controller/tool.controller';
import { Lti11ResponseMapper } from './mapper/lti11-response.mapper';
import { ExternalToolUc } from './uc/external-tool.uc';
import { ExternalToolService } from './service/external-tool.service';
import { ExternalToolRequestMapper } from './mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from './mapper/external-tool-response.mapper';

@Module({
	imports: [UserModule, LoggerModule, SchoolModule, AuthorizationModule, OauthProviderServiceModule, EncryptionModule],
	controllers: [ToolController],
	providers: [
		Lti11Service,
		Lti11Uc,
		LtiRoleMapper,
		Lti11ResponseMapper,
		LtiToolRepo,
		PseudonymsRepo,
		ExternalToolRepoMapper,
		ExternalToolRepo,
		ExternalToolUc,
		ExternalToolService,
		ExternalToolRequestMapper,
		ExternalToolResponseMapper,
	],
	exports: [ExternalToolRepo, LtiToolRepo],
})
export class ToolModule {}
