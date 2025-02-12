import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EncryptionModule } from '@infra/encryption';
import { LoggerModule } from '@core/logger';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { BiloMediaClientAdapter } from './bilo-media-client.adapter';

@Module({
	imports: [HttpModule, EncryptionModule, LoggerModule, OauthAdapterModule],
	providers: [BiloMediaClientAdapter],
	exports: [BiloMediaClientAdapter],
})
export class BiloClientModule {}
