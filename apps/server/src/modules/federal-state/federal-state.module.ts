import { Module } from '@nestjs/common';
import { FederalStateRepo } from './repo';
import { FederalStateService } from './service/federal-state.service';

@Module({
	providers: [FederalStateService, FederalStateRepo],
	exports: [FederalStateService],
})
export class FederalStateModule {}
