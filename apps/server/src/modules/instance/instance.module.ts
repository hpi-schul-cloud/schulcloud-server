import { Module } from '@nestjs/common';
import { InstanceRepo } from './repo';
import { InstanceService } from './service';

@Module({
	providers: [InstanceRepo, InstanceService],
	exports: [InstanceService],
})
export class InstanceModule {}
