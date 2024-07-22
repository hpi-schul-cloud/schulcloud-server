import { LtiToolModule } from '@modules/lti-tool';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { IdTokenService } from './domain/service/id-token.service';
import { OauthProviderLoginFlowService } from './domain/service/oauth-provider.login-flow.service';
import { OauthProviderServiceModule } from './oauth-provider-service.module';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, PseudonymModule, LtiToolModule, ToolModule],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
	exports: [OauthProviderLoginFlowService, IdTokenService],
})
export class OauthProviderModule {}
