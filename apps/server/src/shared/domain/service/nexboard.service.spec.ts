import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { NexboardService } from './nexboard.service';

describe('Nexboard service', () => {
	let module: TestingModule;
	let nexboardService: NexboardService;
	let feathersServiceProvider: DeepMocked<FeathersServiceProvider>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				NexboardService,
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		nexboardService = module.get(NexboardService);
		feathersServiceProvider = module.get(FeathersServiceProvider);
	});

	describe('create Nexboard', () => {
		it('it should call feathers service', async () => {
			feathersServiceProvider
				.getService('/nexboard/boards')
				.create.mockResolvedValue({ id: '123', publiclink: 'boardId' });

			const userId: EntityId = new ObjectId().toHexString();

			const response = await nexboardService.createNexboard(userId, 'title', 'description');
			if (response) {
				expect(response.board).toEqual('123');
				expect(response.url).toEqual('boardId');
			}
		});

		it('should return false if nexboard call fails', async () => {
			feathersServiceProvider.getService('/nexboard/boards').create.mockRejectedValue({});

			const userId: EntityId = new ObjectId().toHexString();

			const nexboard = await nexboardService.createNexboard(userId, 'title', 'description');
			expect(nexboard).toEqual(false);
		});
	});
});
