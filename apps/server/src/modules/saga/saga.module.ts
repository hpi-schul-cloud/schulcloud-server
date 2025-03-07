import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SagaExecutorService } from './service/executor';
import { SagaInjectionService } from './service/injection';

@Module({
	imports: [CqrsModule],
	providers: [SagaExecutorService, SagaInjectionService],
	exports: [SagaExecutorService, SagaInjectionService],
})
export class SagaModule {}
