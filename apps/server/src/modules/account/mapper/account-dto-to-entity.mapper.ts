import { Account } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountCreateDto } from '../services/dto';

export class AccountDtoToEntityMapper {
	static mapToEntity(dto: AccountCreateDto): Account {
		return new Account({
			username: dto.username,
			userId: new ObjectId(dto.userId),
			password: dto.password,
			systemId: dto.systemId ? new ObjectId(dto.systemId) : undefined,
			activated: dto.activated,
			credentialHash: dto.credentialHash,
			expiresAt: dto.expiresAt,
			lasttriedFailedLogin: dto.lasttriedFailedLogin,
			token: dto.token,
		});
	}
}
