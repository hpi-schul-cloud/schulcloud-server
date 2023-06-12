import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { LtiToolModule } from '@src/modules/lti-tool';
import { PseudonymModule } from '@src/modules/pseudonym';
import { ToolModule } from '@src/modules/tool';
import { UserModule } from '@src/modules/user';
import { IdTokenService } from './service/id-token.service';
import { OauthProviderLoginFlowService } from './service/oauth-provider-login-flow.service';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, PseudonymModule, LtiToolModule, ToolModule],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
})
export class OauthProviderModule {}
