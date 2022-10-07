import { Module } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { HydraAdapter } from '@shared/infra/oauth-provider/hydra/hydra.adapter';
import { HttpModule } from '@nestjs/axios';

@Module({
	imports: [HttpModule],
	providers: [{ provide: OauthProviderService, useClass: HydraAdapter }],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
