import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';

@Injectable()
export class TransactionUtil {
	constructor(private readonly _em: EntityManager, private readonly logger: Logger) {}

	async doTransaction(fn: () => Promise<void>): Promise<void> {
		return this._em.transactional(fn).catch((reason) => this.logger.debug(reason));
	}
}
