import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { LegacyLogger } from '@src/core/logger';
import { NexboardService } from './nexboard.service';

describe('Nexboard service', () => {
	let module: TestingModule;
	let nexboardService: NexboardService;
	let feathersServiceProvider: DeepMocked<FeathersServiceProvider>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NexboardService,
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		nexboardService = module.get(NexboardService);
		feathersServiceProvider = module.get(FeathersServiceProvider);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('create Nexboard', () => {
		it('it should call feathers service', async () => {
			feathersServiceProvider
				.getService('/nexboard/boards')
				.create.mockResolvedValue({ id: '123', publicLink: 'boardId' });

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

			const response = await nexboardService.createNexboard(userId, 'title', 'description');
			expect(response).toEqual(false);
		});
	});
});
