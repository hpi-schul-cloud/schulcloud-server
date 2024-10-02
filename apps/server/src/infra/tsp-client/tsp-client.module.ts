import { Module } from '@nestjs/common';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
