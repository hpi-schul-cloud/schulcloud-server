import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { TransactionUtil } from './transaction.util';

describe('TransactionUtil', () => {
	let module: TestingModule;
	let service: TransactionUtil;
	let logger: Logger;
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
		logger = module.get(Logger);
		entityManager = module.get(EntityManager);
	});

	it('should call transactional method of EntityManager', async () => {
		const transactionalFn = jest.fn().mockResolvedValue(undefined);
		entityManager.transactional.mockResolvedValue(undefined);

		await service.doTransaction(transactionalFn);

		expect(entityManager.transactional).toHaveBeenCalledWith(transactionalFn);
	});

	it('should log error if transactional method throws an error', async () => {
		const error = new Error('Test Error');
		entityManager.transactional.mockRejectedValue(error);

		await service.doTransaction(jest.fn());

		expect(logger.debug).toHaveBeenCalledWith(error);
	});
});
