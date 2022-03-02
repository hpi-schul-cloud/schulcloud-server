import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';

// const bcrypt = require('bcryptjs');

@Injectable()
export class AccountRepo {
	constructor(private readonly em: EntityManager) {}

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

	async findByUserId(userId: EntityId): Promise<Account> {
		const account = await this.repo.findOneOrFail({ user: userId });
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
}
