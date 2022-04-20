import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory } from '@shared/testing';
import { CopyQueueRoutingKeys } from './copy-queue.interface';
import { CopyQueueService } from './copy-queue.service';

describe('CopyQueueService', () => {
	let service: CopyQueueService;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const options = {
		exchange: 'exchange',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CopyQueueService,
				{ provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
				{ provide: 'COPY_QUEUE_OPTIONS', useValue: options },
			],
		}).compile();

		service = module.get(CopyQueueService);
		amqpConnection = module.get(AmqpConnection);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('copy course', () => {
		it('should send given course to queue', async () => {
			const course = courseFactory.build();
			await service.copyCourse(course);
			const expectedParams = [options.exchange, CopyQueueRoutingKeys.COURSE, course, { persistent: true }];
			expect(amqpConnection.publish).toHaveBeenCalledWith(...expectedParams);
		});
	});
});
