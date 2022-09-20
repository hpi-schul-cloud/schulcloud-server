import { Injectable } from '@nestjs/common';
import { Shareable, ShareToken } from '@shared/domain/entity/shareable.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class ShareableRepo extends BaseRepo<Shareable> {
	get entityName() {
		return Shareable;
	}

	async findOneByToken(token: ShareToken): Promise<Shareable> {
		const shareable = await this._em.findOneOrFail(Shareable, { token });
		return shareable;
	}
}
