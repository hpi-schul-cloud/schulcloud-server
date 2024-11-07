import { OauthModule } from '@modules/oauth';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [OauthModule, EncryptionModule],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
