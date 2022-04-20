import { DynamicModule, Module } from '@nestjs/common';
import { CopyQueueConsumer } from './copy-queue.consumer';
import { CopyQueueServiceOptions } from './copy-queue.interface';
import { CopyQueueService } from './copy-queue.service';

@Module({})
export class CopyQueueModule {
	static forRoot(options: CopyQueueServiceOptions): DynamicModule {
		return {
			module: CopyQueueModule,
			providers: [
				CopyQueueService,
				CopyQueueConsumer,
				{
					provide: 'COPY_QUEUE_OPTIONS',
					useValue: {
						exchange: options.exchange,
					},
				},
			],
			exports: [CopyQueueService],
		};
	}
}
