import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@shared/domain/entity';
import { AccountResponseMapper } from '../../repo/mapper';
import { ResolvedAccountDto } from '../../uc/dto';

describe('AccountResponseMapper', () => {
	describe('mapToResponseFromEntity', () => {
		it('should map all fields', () => {
			const testEntity: AccountEntity = {
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
			const testEntity: AccountEntity = {
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

	describe('mapToAccountResponse', () => {
		it('should map all fields', () => {
			const resolvedAccountDto: ResolvedAccountDto = {
				id: new ObjectId().toString(),
				userId: new ObjectId().toString(),
				activated: true,
				username: 'username',
				updatedAt: new Date(),
			};
			const ret = AccountResponseMapper.mapToAccountResponse(resolvedAccountDto);

			expect(ret.id).toBe(resolvedAccountDto.id);
			expect(ret.userId).toBe(resolvedAccountDto.userId?.toString());
			expect(ret.activated).toBe(resolvedAccountDto.activated);
			expect(ret.username).toBe(resolvedAccountDto.username);
			expect(ret.updatedAt).toBe(resolvedAccountDto.updatedAt);
		});
	});
});
