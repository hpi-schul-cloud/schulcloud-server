import { FilterQuery } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { EmptyResultQuery } from '@shared/repo/query';
import { AccountScope } from './account-scope';
import { AccountEntity } from '../../../domain/entity/account.entity';

describe(AccountScope.name, () => {
	describe('byUserIdAndSystemId', () => {
		describe('when build scope query', () => {
			const setup = () => {
				const scope = new AccountScope();
				const systemId = new ObjectId().toHexString();
				const user1Id = new ObjectId().toHexString();
				const user2Id = new ObjectId().toHexString();
				const userIds = [user1Id, user2Id];

				const expected = {
					$and: [
						{
							userId: { $in: [new ObjectId(user1Id), new ObjectId(user2Id)] },
						},
						{
							systemId: new ObjectId(systemId),
						},
					],
				} as FilterQuery<AccountEntity>;

				return { scope, userIds, systemId, expected };
			};
			it('should create valid query returning no results for empty scope', () => {
				const { scope } = setup();
				const result = scope.query;

				expect(result).toBe(EmptyResultQuery);
			});
			it('should create correct query for byUserIdAndSystemId', () => {
				const { scope, userIds, systemId, expected } = setup();
				scope.byUserIdsAndSystemId(userIds, systemId);
				const result = scope.query;

				expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
			});
		});
	});
});
