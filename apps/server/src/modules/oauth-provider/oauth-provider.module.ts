import { LtiToolModule } from '@modules/lti-tool';
import { PseudonymModule } from '@modules/pseudonym';
import { ToolModule } from '@modules/tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TeamsRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { IdTokenService } from './domain/service/id-token.service';
import { OauthProviderLoginFlowService } from './domain/service/oauth-provider.login-flow.service';
import { OauthProviderConfigModule } from './oauth-provider-config.module';

@Module({
	imports: [
		HttpModule,
		UserModule,
		LoggerModule,
		PseudonymModule,
		LtiToolModule,
		ToolModule,
		ToolConfigModule,
		OauthProviderConfigModule,
	],
	providers: [OauthProviderLoginFlowService, IdTokenService, TeamsRepo],
	exports: [OauthProviderLoginFlowService, IdTokenService],
})
export class OauthProviderModule {}
