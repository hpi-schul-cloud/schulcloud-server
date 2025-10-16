import { Module } from '@nestjs/common';
import { RoomCopySaga, UserDeletionSaga } from './impl';
import { SagaRegistryService, SagaService, SagaStepRegistryService } from './service';

@Module({
	imports: [],
	providers: [SagaStepRegistryService, SagaRegistryService, SagaService, UserDeletionSaga, RoomCopySaga],
	exports: [SagaService],
})
export class SagaModule {}
