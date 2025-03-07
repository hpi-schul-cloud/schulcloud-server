import { LoggerModule } from '@core/logger';
import { PseudonymModule } from '@modules/pseudonym';
import { TeamsRepo } from '@modules/teams/repo';
import { ToolModule } from '@modules/tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { IdTokenService } from './domain/service/id-token.service';
import { OauthProviderLoginFlowService } from './domain/service/oauth-provider.login-flow.service';
import { OauthProviderServiceModule } from './oauth-provider-service.module';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, PseudonymModule, ToolModule],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
	exports: [OauthProviderLoginFlowService, IdTokenService],
})
export class OauthProviderModule {}
