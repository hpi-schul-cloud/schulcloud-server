import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { LtiToolModule } from '@modules/lti-tool';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { IdTokenService } from './service/id-token.service';
import { OauthProviderLoginFlowService } from './service/oauth-provider.login-flow.service';

@Module({
	imports: [
		OauthProviderServiceModule,
		UserModule,
		LoggerModule,
		PseudonymModule,
		LtiToolModule,
		ToolModule,
		ToolConfigModule,
	],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
	exports: [OauthProviderLoginFlowService, IdTokenService],
})
export class OauthProviderModule {}
