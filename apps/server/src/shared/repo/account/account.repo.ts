import { EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityNotFoundError } from '@shared/common';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';
import { User } from '@shared/domain/entity/user.entity';

// const bcrypt = require('bcryptjs');

@Injectable()
export class AccountRepo extends BaseRepo<Account> {
	private get repo(): EntityRepository<Account> {
		return this.em.getRepository(Account);
	}

	async create(account: Account): Promise<Account> {
		// account.password = await bcrypt.hash(account.password);
		await this.repo.persistAndFlush(account);
		return account;
	}

	async read(accountId: EntityId): Promise<Account> {
		const account = await this.findOneById(accountId);
		return account;
	}

	async update(account: Account): Promise<Account> {
		await this.repo.persistAndFlush(account);
		return account;
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
}
