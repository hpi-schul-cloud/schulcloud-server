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

	describe('doTransaction', () => {
		describe('when function is given', () => {
			it('should call entitymanager', async () => {
				const test = () => Promise.resolve();
				entityManager.transactional.mockImplementation(() => Promise.resolve());
				await service.doTransaction(test);

				expect(entityManager.transactional).toHaveBeenCalledTimes(1);
				expect(entityManager.transactional).toHaveBeenCalledWith(test);
			});
		});

		describe('when function is given but execution failed ', () => {
			it('should call the logger', async () => {
				const test = () => Promise.reject();
				entityManager.transactional.mockImplementation(() => {
					throw new Error();
				});

				await expect(service.doTransaction(test)).rejects.toThrowError();
			});
		});
	});
});
