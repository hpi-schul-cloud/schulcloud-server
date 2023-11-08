import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OauthProviderService } from './oauth-provider.service';
import { HydraAdapter } from './hydra/hydra.adapter';

@Module({
	imports: [HttpModule],
	providers: [{ provide: OauthProviderService, useClass: HydraAdapter }],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
