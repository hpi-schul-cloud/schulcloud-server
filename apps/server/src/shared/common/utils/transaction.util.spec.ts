import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { TransactionUtil } from './transaction.util';

class TransactionUtilSpec extends TransactionUtil {
	async doTransaction(fn: () => Promise<void>): Promise<void> {
		await fn();
	}
}
describe('TransactionUtil', () => {
	let module: TestingModule;
	let service: TransactionUtil;
	let entityManager: DeepMocked<EntityManager>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TransactionUtil,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		service = module.get(TransactionUtil);
		entityManager = module.get(EntityManager);
	});

	describe('doTransaction', () => {
		it('should do transaction successfully', async () => {
			entityManager.transactional.mockResolvedValue(Promise.resolve());
			await service.doTransaction(() => Promise.resolve());

			expect(entityManager.transactional).toHaveBeenCalledTimes(1);
		});
	});
});
