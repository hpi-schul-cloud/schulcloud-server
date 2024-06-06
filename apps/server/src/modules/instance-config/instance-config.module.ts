import { Module } from '@nestjs/common';
import { InstanceConfigRepo } from './repo';
import { InstanceConfigService } from './service';

@Module({
	providers: [InstanceConfigRepo, InstanceConfigService],
	exports: [InstanceConfigService],
})
export class InstanceConfigModule {}
