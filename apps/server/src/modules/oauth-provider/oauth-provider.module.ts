import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderController } from '@src/modules/oauth-provider/controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.login-flow.uc';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [OauthProviderServiceModule, LoggerModule],
	providers: [
		OauthProviderUc,
		OauthProviderLoginFlowUc,
		OauthProviderResponseMapper,
		OauthProviderLoginFlowService,
		LtiToolRepo,
		PseudonymsRepo,
		UserRepo,
		RoleRepo,
		PermissionService,
	],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
