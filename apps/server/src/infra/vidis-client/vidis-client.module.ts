import { Module } from '@nestjs/common';
import { VidisClientFactory } from './vidis-client-factory';

@Module({
	imports: [],
	providers: [VidisClientFactory],
	exports: [VidisClientFactory],
})
export class VidisClientModule {}
