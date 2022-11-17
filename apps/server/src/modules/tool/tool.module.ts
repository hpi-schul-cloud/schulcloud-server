import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { Lti11ResponseMapper } from '@src/modules/tool/mapper/lti11-response.mapper';
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school';
import { ToolController } from '@src/modules/tool/controller/tool.controller';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { ExternalToolUc } from '@src/modules/tool/uc/external-tool.uc';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolResponseMapper } from '@src/modules/tool/mapper/external-tool-response.mapper';
import { ExternalToolRequestMapper } from '@src/modules/tool/mapper/external-tool-request.mapper';
import { AuthorizationModule } from '@src/modules/authorization';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { UserModule } from '../user';

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
