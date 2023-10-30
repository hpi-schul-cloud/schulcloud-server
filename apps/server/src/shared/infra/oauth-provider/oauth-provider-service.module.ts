import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { HydraAdapter } from './hydra/hydra.adapter';
import { OauthProviderService } from './oauth-provider.service';

@Module({
	imports: [HttpModule],
	providers: [{ provide: OauthProviderService, useClass: HydraAdapter }],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
