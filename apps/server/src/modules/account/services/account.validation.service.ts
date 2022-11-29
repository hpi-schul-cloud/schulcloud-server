import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountRepo } from '../repo/account.repo';

@Injectable()
export class AccountValidationService {
	constructor(private accountRepo: AccountRepo, private userRepo: UserRepo) {}

	async isUniqueEmail(email: string, userId?: EntityId, accountId?: EntityId, systemId?: EntityId): Promise<boolean> {
		const [foundUsers, { accounts: foundAccounts }] = await Promise.all([
			// Test coverage: Missing branch null check; unreachable
			this.userRepo.findByEmail(email),
			AccountEntityToDtoMapper.mapSearchResult(await this.accountRepo.searchByUsernameExactMatch(email)),
		]);

		const filteredAccounts = foundAccounts.filter((foundAccount) => foundAccount.systemId === systemId);

		return !(
			foundUsers.length > 1 ||
			filteredAccounts.length > 1 ||
			// paranoid 'toString': legacy code may call userId or accountId as ObjectID
			(foundUsers.length === 1 && foundUsers[0].id.toString() !== userId?.toString()) ||
			(filteredAccounts.length === 1 && filteredAccounts[0].id.toString() !== accountId?.toString())
		);
	}

	async isUniqueEmailForUser(email: string, userId: EntityId): Promise<boolean> {
		const account = await this.accountRepo.findByUserId(userId);
		return this.isUniqueEmail(email, userId, account?.id, account?.systemId?.toString());
	}

	async isUniqueEmailForAccount(email: string, accountId: EntityId): Promise<boolean> {
		const account = await this.accountRepo.findById(accountId);
		return this.isUniqueEmail(email, account.userId?.toString(), account.id, account?.systemId?.toString());
	}
}
