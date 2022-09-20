import { Injectable } from '@nestjs/common';
import { ShareToken, ShareTokenString } from '@shared/domain/entity/share-token.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class ShareTokenRepo extends BaseRepo<ShareToken> {
	get entityName() {
		return ShareToken;
	}

	async findOneByToken(token: ShareTokenString): Promise<ShareToken> {
		const shareToken = await this._em.findOneOrFail(ShareToken, { token });
		return shareToken;
	}
}
