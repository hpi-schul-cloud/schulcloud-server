import { Module } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';

@Module({
	providers: [{ provide: OauthProviderService, useClass: HydraService }],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
