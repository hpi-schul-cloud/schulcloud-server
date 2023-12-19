import { AccountEntity } from '@shared/domain/entity';
import { ObjectId } from 'bson';
import { AccountEntityToDoMapper } from './account-entity-to-do.mapper';

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
		it('should map all fields', () => {
			const testEntity: AccountEntity = {
				_id: new ObjectId(),
				id: 'id',
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: new ObjectId(),
				username: 'username',
				activated: true,
				credentialHash: 'credentialHash',
				expiresAt: new Date(),
				lasttriedFailedLogin: new Date(),
				password: 'password',
				systemId: new ObjectId(),
				token: 'token',
			};
			const ret = AccountEntityToDoMapper.mapToDo(testEntity);

			expect(ret.id).toBe(testEntity.id);
			expect(ret.createdAt).toEqual(testEntity.createdAt);
			expect(ret.updatedAt).toEqual(testEntity.createdAt);
			expect(ret.userId).toBe(testEntity.userId?.toString());
			expect(ret.username).toBe(testEntity.username);
			expect(ret.activated).toBe(testEntity.activated);
			expect(ret.credentialHash).toBe(testEntity.credentialHash);
			expect(ret.expiresAt).toBe(testEntity.expiresAt);
			expect(ret.lasttriedFailedLogin).toBe(testEntity.lasttriedFailedLogin);
			expect(ret.password).toBe(testEntity.password);
			expect(ret.systemId).toBe(testEntity.systemId?.toString());
			expect(ret.token).toBe(testEntity.token);
		});

		it('should ignore missing ids', () => {
			const testEntity: AccountEntity = {
				_id: new ObjectId(),
				id: 'id',
				username: 'username',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const ret = AccountEntityToDoMapper.mapToDo(testEntity);

			expect(ret.userId).toBeUndefined();
			expect(ret.systemId).toBeUndefined();
		});
	});

	describe('mapSearchResult', () => {
		it('should use actual date if date is', () => {
			const testEntity1: AccountEntity = {
				_id: new ObjectId(),
				id: '1',
				username: '1',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const testEntity2: AccountEntity = {
				_id: new ObjectId(),
				id: '2',
				username: '2',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const testAmount = 10;

			const [accounts, total] = AccountEntityToDoMapper.mapSearchResult([[testEntity1, testEntity2], testAmount]);

			expect(total).toBe(testAmount);
			expect(accounts).toHaveLength(2);
			expect(accounts).toContainEqual(expect.objectContaining({ id: '1' }));
			expect(accounts).toContainEqual(expect.objectContaining({ id: '2' }));
		});
	});

	describe('mapAccountsToDo', () => {
		it('should use actual date if date is', () => {
			const testEntity1: AccountEntity = {
				_id: new ObjectId(),
				username: '1',
				id: '1',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const testEntity2: AccountEntity = {
				_id: new ObjectId(),
				username: '2',
				id: '2',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const ret = AccountEntityToDoMapper.mapAccountsToDo([testEntity1, testEntity2]);

			expect(ret).toHaveLength(2);
			expect(ret).toContainEqual(expect.objectContaining({ id: '1' }));
			expect(ret).toContainEqual(expect.objectContaining({ id: '2' }));
		});
	});
});
