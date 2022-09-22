import { Injectable } from '@nestjs/common';
import { EntityId, ShareTokenContext, ShareTokenDO, ShareTokenParentType, ShareTokenPayload } from '@shared/domain';
import { ObjectId } from 'bson';
import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	constructor(private readonly shareTokenService: ShareTokenService) {}

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenDO> {
		const shareToken = new ShareTokenDO({
			token,
			payload: {
				parentType: ShareTokenParentType.Course,
				parentId: new ObjectId().toHexString(),
			},
		});

		return Promise.resolve(shareToken);
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		const token = await this.shareTokenService.createToken(payload, options);

		return token;
	}
}
