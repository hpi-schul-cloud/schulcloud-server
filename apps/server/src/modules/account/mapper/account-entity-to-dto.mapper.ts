import { Account } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';

export class AccountEntityToDtoMapper {
	static mapToDto(account: Account): AccountDto {
		return new AccountDto({
			id: account.id,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			userId: account.user.id,
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			password: account.password,
			systemId: account.system ? account.system.id : undefined,
			token: account.token,
		});
	}
}
