import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '../../repo/micro-orm/account.repo';

@Injectable()
export class AccountValidationService {
	constructor(private accountRepo: AccountRepo, private userRepo: UserRepo) {}

	async isUniqueEmail(email: string, userId?: EntityId, accountId?: EntityId, systemId?: EntityId): Promise<boolean> {
		const foundUsers = await this.userRepo.findByEmail(email);
		const [accounts] = await this.accountRepo.searchByUsernameExactMatch(email);
		const filteredAccounts = accounts.filter((foundAccount) => foundAccount.systemId === systemId);

		const multipleUsers = foundUsers.length > 1;
		const multipleAccounts = filteredAccounts.length > 1;
		// paranoid 'toString': legacy code may call userId or accountId as ObjectID
		const oneUserWithoutGivenId = foundUsers.length === 1 && foundUsers[0].id.toString() !== userId?.toString();
		const oneAccountWithoutGivenId =
			filteredAccounts.length === 1 && filteredAccounts[0].id.toString() !== accountId?.toString();

		const isUnique = !(multipleUsers || multipleAccounts || oneUserWithoutGivenId || oneAccountWithoutGivenId);

		return isUnique;
	}

	async isUniqueEmailForUser(email: string, userId: EntityId): Promise<boolean> {
		const account = await this.accountRepo.findByUserId(userId);
		return this.isUniqueEmail(email, userId, account?.id, account?.systemId?.toString());
	}

	async isUniqueEmailForAccount(email: string, accountId: EntityId): Promise<boolean> {
		const account = await this.accountRepo.findById(accountId);
		return this.isUniqueEmail(email, account.userId?.toString(), account.id, account.systemId?.toString());
	}
}
