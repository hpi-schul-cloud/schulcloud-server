import { OauthModule } '@modules/oauth';
import { Module } from '@nestjs/common';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [OauthModule],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
