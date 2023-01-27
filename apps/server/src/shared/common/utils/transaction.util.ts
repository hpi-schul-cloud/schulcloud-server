import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '../../repo';
import { UserDORepo } from '../../repo/user/user-do.repo';

@Injectable()
export class TransactionUtil {
	constructor(private readonly _em: EntityManager) {}

	async doInTransaction(fn: () => Promise<void>): Promise<void> {
		return this._em.transactional(fn);
	}
}
