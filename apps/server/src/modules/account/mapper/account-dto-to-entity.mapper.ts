import { ObjectId } from '@mikro-orm/mongodb';
import { Account } from '@shared/domain';
import { AccountCreateDto } from '../services/dto';

export class AccountDtoToEntityMapper {
	static mapToEntity(dto: AccountCreateDto): Account {
		return new Account({
			username: dto.username,
			userId: dto.userId ? new ObjectId(dto.userId) : undefined,
			systemId: dto.systemId ? new ObjectId(dto.systemId) : undefined,
			password: dto.password,
			credentialHash: dto.credentialHash,
			token: dto.token,
			lasttriedFailedLogin: dto.lasttriedFailedLogin,
			activated: dto.activated,
			expiresAt: dto.expiresAt,
		});
	}
}
