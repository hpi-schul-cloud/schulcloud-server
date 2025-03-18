import { Module } from '@nestjs/common';
import { SagaRegistryService, SagaService, SagaStepRegistryService } from './service';

@Module({
	imports: [],
	providers: [SagaStepRegistryService, SagaRegistryService, SagaService],
	exports: [SagaService],
})
export class SagaModule {}
