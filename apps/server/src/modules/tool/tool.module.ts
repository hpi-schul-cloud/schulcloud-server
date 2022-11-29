import { Module } from '@nestjs/common';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { EncryptionModule } from '@shared/infra/encryption';
import { ExternalToolSortingMapper } from '@shared/repo/externaltool/external-tool-sorting.mapper';
import { Lti11Uc } from './uc/lti11.uc';
import { LtiRoleMapper } from './mapper/lti-role.mapper';
import { Lti11Service } from './service/lti11.service';
import { ExternalToolService } from './service/external-tool.service';
import { ToolController } from './controller/tool.controller';
import { UserModule } from '../user';
import { SchoolModule } from '../school';
import { Lti11ResponseMapper } from './mapper/lti11-response.mapper';
import { ExternalToolUc } from './uc/external-tool.uc';
import { ExternalToolResponseMapper } from './mapper/external-tool-response.mapper';
import { ExternalToolRequestMapper } from './mapper/external-tool-request.mapper';

@Module({
	imports: [UserModule, LoggerModule, SchoolModule, AuthorizationModule, OauthProviderServiceModule, EncryptionModule],
	exports: [Lti11Service, ExternalToolService],
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
		ExternalToolSortingMapper,
	],
})
export class ToolModule {}
