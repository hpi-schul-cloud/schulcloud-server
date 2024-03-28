import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain/interface';
import { Account } from '../../domain';
import { AccountIdmToDoMapper } from './account-idm-to-do.mapper.abstract';
import { AccountIdmToDoMapperIdm } from './account-idm-to-do.mapper.idm';

describe('AccountIdmToDoMapperIdm', () => {
	let module: TestingModule;
	let mapper: AccountIdmToDoMapper;

	const now: Date = new Date(2022, 1, 22);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: AccountIdmToDoMapper,
					useClass: AccountIdmToDoMapperIdm,
				},
			],
		}).compile();

		mapper = module.get(AccountIdmToDoMapper);

		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapToDo', () => {
		describe('when mapping from entity to do', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
					username: 'username',
					email: 'email',
					firstName: 'firstName',
					lastName: 'lastName',
					createdDate: new Date(),
					attDbcAccountId: 'attDbcAccountId',
					attDbcUserId: 'attDbcUserId',
					attDbcSystemId: 'attDbcSystemId',
				};
				return testIdmEntity;
			};

			it('should map all fields', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDo(testIdmEntity);

				expect(ret).toEqual(
					expect.objectContaining<Partial<Account>>({
						id: testIdmEntity.id,
						idmReferenceId: undefined,
						userId: testIdmEntity.attDbcUserId,
						systemId: testIdmEntity.attDbcSystemId,
						createdAt: testIdmEntity.createdDate,
						updatedAt: testIdmEntity.createdDate,
						username: testIdmEntity.username,
					})
				);
			});
		});
		describe('when date is undefined', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
				};
				return testIdmEntity;
			};

			it('should use actual date', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDo(testIdmEntity);

				expect(ret.createdAt).toEqual(now);
				expect(ret.updatedAt).toEqual(now);
			});
		});

		describe('when a fields value is missing', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
				};
				return testIdmEntity;
			};

			it('should fill with empty string', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDo(testIdmEntity);

				expect(ret.username).toBe('');
			});
		});
	});
});
