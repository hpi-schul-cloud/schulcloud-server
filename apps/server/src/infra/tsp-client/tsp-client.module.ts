import { OauthAdapterModule } from '@modules/oauth-adapter';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { EncryptionModule } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [LoggerModule, OauthAdapterModule, EncryptionModule],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
