import { accountFactory } from '@shared/testing';
import { Account } from '@shared/domain/entity';
import { AccountEntityToDtoMapper } from './account-entity-to-dto.mapper';

describe('AccountEntityToDtoMapper', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('mapToDto', () => {
		describe('When mapping AccountEntity to AccountDto', () => {
			const setup = () => {
				const accountEntity = accountFactory.withAllProperties().buildWithId({}, '000000000000000000000001');

				const missingSystemUserIdEntity: Account = accountFactory.withoutSystemAndUserId().build();

				return { accountEntity, missingSystemUserIdEntity };
			};

			it('should map all fields', () => {
				const { accountEntity } = setup();

				const ret = AccountEntityToDtoMapper.mapToDto(accountEntity);

				expect({ ...ret, _id: accountEntity._id }).toMatchObject(accountEntity);
			});

			it('should ignore missing ids', () => {
				const { missingSystemUserIdEntity } = setup();

				const ret = AccountEntityToDtoMapper.mapToDto(missingSystemUserIdEntity);

				expect(ret.userId).toBeUndefined();
				expect(ret.systemId).toBeUndefined();
			});
		});
	});

	describe('mapSearchResult', () => {
		describe('When mapping multiple Account entities', () => {
			const setup = () => {
				const testEntity1: Account = accountFactory.buildWithId({}, '000000000000000000000001');
				const testEntity2: Account = accountFactory.buildWithId({}, '000000000000000000000002');

				const testAmount = 10;

				const testEntities = [testEntity1, testEntity2];

				return { testEntities, testAmount };
			};

			it('should map exact same amount of entities', () => {
				const { testEntities, testAmount } = setup();

				const [accounts, total] = AccountEntityToDtoMapper.mapSearchResult([testEntities, testAmount]);

				expect(total).toBe(testAmount);
				expect(accounts).toHaveLength(2);
				expect(accounts).toContainEqual(expect.objectContaining({ id: '000000000000000000000001' }));
				expect(accounts).toContainEqual(expect.objectContaining({ id: '000000000000000000000002' }));
			});
		});
	});

	describe('mapAccountsToDto', () => {
		describe('When mapping multiple Account entities', () => {
			const setup = () => {
				const testEntity1: Account = accountFactory.buildWithId({}, '000000000000000000000001');
				const testEntity2: Account = accountFactory.buildWithId({}, '000000000000000000000002');

				const testEntities = [testEntity1, testEntity2];

				return testEntities;
			};

			it('should map all entities', () => {
				const testEntities = setup();

				const ret = AccountEntityToDtoMapper.mapAccountsToDto(testEntities);

				expect(ret).toHaveLength(2);
				expect(ret).toContainEqual(expect.objectContaining({ id: '000000000000000000000001' }));
				expect(ret).toContainEqual(expect.objectContaining({ id: '000000000000000000000002' }));
			});
		});
	});
});
