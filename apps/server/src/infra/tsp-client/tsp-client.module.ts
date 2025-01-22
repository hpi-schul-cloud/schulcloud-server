import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { OauthModule } from '@modules/oauth';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [LoggerModule, OauthModule, EncryptionModule, ErrorModule],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
