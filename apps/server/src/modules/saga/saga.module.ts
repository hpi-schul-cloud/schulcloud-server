import { Module } from '@nestjs/common';
import { UserDeletionSaga } from './impl';
import { SagaRegistryService, SagaService, SagaStepRegistryService } from './service';

@Module({
	imports: [],
	providers: [SagaStepRegistryService, SagaRegistryService, SagaService, UserDeletionSaga],
	exports: [SagaService],
})
export class SagaModule {}
