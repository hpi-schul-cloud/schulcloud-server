import { Module } from '@nestjs/common';
import { SpawnService } from './spawn.service';

@Module({
	providers: [SpawnService],
	exports: [SpawnService],
})
export class SpawnModule {}
