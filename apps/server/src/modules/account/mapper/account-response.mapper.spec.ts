import { Account } from '@shared/domain';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountResponseMapper } from '.';

describe('AccountResponseMapper', () => {
	describe('mapToResponseFromEntity', () => {
		it('should map all fields', () => {
			const testEntity: Account = {
				_id: new ObjectId(),
				id: new ObjectId().toString(),
				userId: new ObjectId(),
				activated: true,
				username: 'username',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const ret = AccountResponseMapper.mapToResponseFromEntity(testEntity);

			expect(ret.id).toBe(testEntity.id);
			expect(ret.userId).toBe(testEntity.userId?.toString());
			expect(ret.activated).toBe(testEntity.activated);
			expect(ret.username).toBe(testEntity.username);
			expect(ret.updatedAt).toBe(testEntity.updatedAt);
		});

		it('should ignore missing userId', () => {
			const testEntity: Account = {
				_id: new ObjectId(),
				id: new ObjectId().toString(),
				userId: undefined,
				activated: true,
				username: 'username',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const ret = AccountResponseMapper.mapToResponseFromEntity(testEntity);

			expect(ret.userId).toBeUndefined();
		});
	});

	describe('mapToResponse', () => {
		it('should map all fields', () => {
			const testDto: AccountDto = {
				id: new ObjectId().toString(),
				userId: new ObjectId().toString(),
				activated: true,
				username: 'username',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const ret = AccountResponseMapper.mapToResponse(testDto);

			expect(ret.id).toBe(testDto.id);
			expect(ret.userId).toBe(testDto.userId?.toString());
			expect(ret.activated).toBe(testDto.activated);
			expect(ret.username).toBe(testDto.username);
			expect(ret.updatedAt).toBe(testDto.updatedAt);
		});
	});
});
