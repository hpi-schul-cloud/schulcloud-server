import { OauthModule } from '@modules/oauth';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EncryptionModule } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [LoggerModule, OauthModule, EncryptionModule],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
