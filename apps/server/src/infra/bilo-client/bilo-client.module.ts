import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { BiloMediaRestClient } from './bilo-media-rest-client';

@Module({
	imports: [HttpModule, OauthAdapterModule, EncryptionModule],
	providers: [BiloMediaRestClient],
	exports: [BiloMediaRestClient],
})
export class BiloClientModule {}
