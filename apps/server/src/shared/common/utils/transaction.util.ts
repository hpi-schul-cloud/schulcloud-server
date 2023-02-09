import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';

@Injectable()
export class TransactionUtil {
	constructor(private readonly _em: EntityManager, private readonly logger: Logger) {}

	async doTransaction(fn: () => Promise<void>): Promise<void> {
		const transactionPromise = this._em.transactional(fn);
		return transactionPromise.catch((error) => {
			this.logger.debug(error);
		});
	}
}
