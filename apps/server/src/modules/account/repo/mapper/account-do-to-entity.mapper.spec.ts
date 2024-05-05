import { accountDoFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountDoToEntityMapper } from './account-do-to-entity.mapper';

describe('AccountEntityToDoMapper', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('mapToEntity', () => {
		describe('When mapping Account DO to AccountEntity', () => {
			const setup = () => {
				const account = accountDoFactory.build({
					password: 'password',
					credentialHash: 'credentialHash',
					userId: new ObjectId().toHexString(),
					systemId: new ObjectId().toHexString(),
					expiresAt: new Date(),
					lasttriedFailedLogin: new Date(),
					token: 'token',
					activated: true,
					idmReferenceId: 'idmReferenceId',
					deactivatedAt: new Date(),
				});

				return { account };
			};

			it('should map all fields', () => {
				const { account } = setup();

				const ret = AccountDoToEntityMapper.mapToEntity(account);

				const expected = {
					password: account.password,
					credentialHash: account.credentialHash,
					userId: new ObjectId(account.userId),
					systemId: new ObjectId(account.systemId),
					expiresAt: account.expiresAt,
					lasttriedFailedLogin: account.lasttriedFailedLogin,
					token: account.token,
					activated: account.activated,
					id: account.id,
					_id: new ObjectId(account.id),
					createdAt: account.createdAt,
					updatedAt: account.updatedAt,
					deactivatedAt: account.deactivatedAt,
				};

				expect(ret).toEqual(expect.objectContaining(expected));
			});
		});
	});
});
