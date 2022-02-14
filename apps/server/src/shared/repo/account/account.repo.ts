import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId } from '@shared/domain';
import { Account } from '@shared/domain/entity/account.entity';

@Injectable()
export class AccountRepo {
	constructor(private readonly em: EntityManager) {}

	private get repo(): EntityRepository<Account> {
		return this.em.getRepository(Account);
	}

	async create(account: Account): Promise<Account> {
		await this.repo.persistAndFlush(account);
		return account;
	}

	async read(accountId: EntityId): Promise<Account> {
		const account = await this.findOne(accountId);
		return account;
	}

	async update(account: Account): Promise<Account> {
		await this.repo.persistAndFlush(account);
		return account;
	}

	async remove(accountId: EntityId): Promise<Account> {
		const account = await this.findOne(accountId);
		await this.em.removeAndFlush(account);
		return account;
	}

	private async findOne(accountId: EntityId): Promise<Account> {
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
