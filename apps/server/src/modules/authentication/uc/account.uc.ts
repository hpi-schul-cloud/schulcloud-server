import { Injectable } from '@nestjs/common';
import { Account, EntityId } from '@shared/domain';
import { AccountRepo } from '@shared/repo/account';
import bcrypt from 'bcryptjs';

@Injectable()
export class AccountUc {
	constructor(private readonly accountRepo: AccountRepo) {}

	findOneById(accountId: EntityId): Promise<Account> {
		return this.accountRepo.read(accountId);
	}

	// create(account: Account): Promise<Account> {
	// 	return this.accountRepo.create(account);
	// }

	// update(account: Account): Promise<Account> {
	// 	return this.accountRepo.update(account);
	// }

	remove(accountId: EntityId): Promise<Account> {
		return this.accountRepo.delete(accountId);
	}

	async changePasswordForUser(userId: EntityId, password: string): Promise<string> {
		// TODO check user rights, password pattern,...
		throw new Error('Endpoint is WIP. Missing user right check');
		const account = await this.accountRepo.findByUserId(userId);
		account.password = await bcrypt.hash(password, 10);
		await this.accountRepo.update(account);

		return 'this.accountRepo.update(account);';
	}
}
