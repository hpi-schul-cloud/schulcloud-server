import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { AccountRepo, UserRepo } from '@shared/repo';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';

@Injectable()
export class AccountValidationService {
	constructor(private accountRepo: AccountRepo, private userRepo: UserRepo) {}

	async isUniqueEmail(email: string, userId?: EntityId, accountId?: EntityId, systemId?: EntityId): Promise<boolean> {
		const [usersAccountId, foundUsers, { accounts: foundAccounts }] = await Promise.all([
			// Test coverage: Missing branch null check; unreachable
			accountId ?? (userId ? this.accountRepo.findByUserId(userId).then((account) => account?.id) : undefined),
			this.userRepo.findByEmail(email),
			AccountEntityToDtoMapper.mapSearchResult(await this.accountRepo.searchByUsernameExactMatch(email)),
		]);

		const filteredAccounts = foundAccounts.filter((foundAccount) => foundAccount.systemId === systemId);

		return !(
			foundUsers.length > 1 ||
			filteredAccounts.length > 1 ||
			// paranoid 'toString': legacy code may call userId or accountId as ObjectID
			(foundUsers.length === 1 && foundUsers[0].id.toString() !== userId?.toString()) ||
			(filteredAccounts.length === 1 && filteredAccounts[0].id.toString() !== usersAccountId?.toString())
		);
	}
}
