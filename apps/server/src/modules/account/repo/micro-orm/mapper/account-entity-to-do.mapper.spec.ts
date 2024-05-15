import { AccountEntityToDoMapper } from './account-entity-to-do.mapper';
import { AccountEntity } from '../../../domain/entity/account.entity';
import { accountFactory } from '../../../testing';

describe('AccountEntityToDoMapper', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('mapToDo', () => {
		describe('When mapping AccountEntity to Account', () => {
			const setup = () => {
				const accountEntity = accountFactory.withAllProperties().buildWithId({}, '000000000000000000000001');

				const missingSystemUserIdEntity: AccountEntity = accountFactory.withoutSystemAndUserId().build();

				return { accountEntity, missingSystemUserIdEntity };
			};

			it('should map all fields', () => {
				const { accountEntity } = setup();

				const ret = AccountEntityToDoMapper.mapToDo(accountEntity);

				expect({ ...ret.getProps(), _id: accountEntity._id }).toMatchObject(accountEntity);
			});

			it('should ignore missing ids', () => {
				const { missingSystemUserIdEntity } = setup();

				const ret = AccountEntityToDoMapper.mapToDo(missingSystemUserIdEntity);

				expect(ret.userId).toBeUndefined();
				expect(ret.systemId).toBeUndefined();
			});
		});
	});

	describe('mapCountedEntities', () => {
		describe('When mapping multiple Account entities', () => {
			const setup = () => {
				const testEntity1: AccountEntity = accountFactory.buildWithId({}, '000000000000000000000001');
				const testEntity2: AccountEntity = accountFactory.buildWithId({}, '000000000000000000000002');

				const testAmount = 10;

				const testEntities = [testEntity1, testEntity2];

				return { testEntities, testAmount };
			};

			it('should map exact same amount of entities', () => {
				const { testEntities, testAmount } = setup();

				const [accounts, total] = AccountEntityToDoMapper.mapCountedEntities([testEntities, testAmount]);

				expect(total).toBe(testAmount);
				expect(accounts).toHaveLength(2);
				expect(accounts).toContainEqual(expect.objectContaining({ id: '000000000000000000000001' }));
				expect(accounts).toContainEqual(expect.objectContaining({ id: '000000000000000000000002' }));
			});
		});
	});

	describe('mapEntitiesToDos', () => {
		describe('When mapping multiple Account entities', () => {
			const setup = () => {
				const testEntity1: AccountEntity = accountFactory.buildWithId({}, '000000000000000000000001');
				const testEntity2: AccountEntity = accountFactory.buildWithId({}, '000000000000000000000002');

				const testEntities = [testEntity1, testEntity2];

				return testEntities;
			};

			it('should map all entities', () => {
				const testEntities = setup();

				const ret = AccountEntityToDoMapper.mapEntitiesToDos(testEntities);

				expect(ret).toHaveLength(2);
				expect(ret).toContainEqual(expect.objectContaining({ id: '000000000000000000000001' }));
				expect(ret).toContainEqual(expect.objectContaining({ id: '000000000000000000000002' }));
			});
		});
	});
});
