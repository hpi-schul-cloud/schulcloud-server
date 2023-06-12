import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { UserModule } from '@src/modules/user';
import { PseudonymModule } from '../pseudonym';
import { IdTokenService } from './service/id-token.service';
import { OauthProviderLoginFlowService } from './service/oauth-provider-login-flow.service';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, PseudonymModule],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
})
export class OauthProviderModule {}
