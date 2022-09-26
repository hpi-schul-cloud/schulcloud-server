import { Module } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { HttpModule } from '@nestjs/axios';

@Module({
	imports: [HttpModule],
	providers: [{ provide: OauthProviderService, useClass: HydraService }],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
