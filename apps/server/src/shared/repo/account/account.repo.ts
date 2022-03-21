import { wrap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityNotFoundError } from '@shared/common';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	repo = this.em.getRepository(Account);

	async create(account: Account): Promise<Account> {
		await this.repo.persistAndFlush(account);
		return account;
	}

	async read(accountId: EntityId): Promise<Account> {
		const account = await this.findOneById(accountId);
		return account;
	}

	async update(account: Account): Promise<Account> {
		const entity = await this.repo.findOneOrFail({ id: account.id });
		wrap(entity).assign(account);
		await this.em.flush();
		return entity;
	}

	async delete(accountId: EntityId): Promise<Account> {
		const account = await this.findOneById(accountId);
		await this.em.removeAndFlush(account);
		return account;
	}

	private async findOneById(accountId: EntityId): Promise<Account> {
		const account = await this.repo.findOneOrFail(
			{ id: accountId },
			{
				failHandler: (entityName: string, where: Record<string, unknown>) => {
					return new EntityNotFoundError(entityName, where);
				},
			}
		);
		return account;
	}

	async findByUserId(userId: EntityId): Promise<Account> {
		const account = await this.repo.findOneOrFail({ user: userId });
		return account;
	}

	async findOneByUser(user: User): Promise<Account> {
		return this.findByUserId(user.id);
	}

	async findByUsername(userName: string): Promise<Account[]> {
		const account = await this.repo.find({
			// find mail case-insensitive by regex
			username: new RegExp(`^${userName.replace(/[^A-Za-z0-9_]/g, '\\$&')}$`, 'i'),
		});
		return account;
	}
}
