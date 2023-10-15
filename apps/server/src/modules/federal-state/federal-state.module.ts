import { Module } from '@nestjs/common';
import { FederalStateRepo } from './repo';
import { FederalStateService } from './service';

@Module({
	providers: [FederalStateService, FederalStateRepo],
	exports: [FederalStateService, FederalStateRepo],
})
export class FederalStateModule {}
