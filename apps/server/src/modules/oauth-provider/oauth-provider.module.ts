import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider/oauth-provider-service.module';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { LtiToolModule } from '../lti-tool/lti-tool.module';
import { PseudonymModule } from '../pseudonym/pseudonym.module';
import { ToolConfigModule } from '../tool/tool-config.module';
import { ToolModule } from '../tool/tool.module';
import { UserModule } from '../user/user.module';
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
