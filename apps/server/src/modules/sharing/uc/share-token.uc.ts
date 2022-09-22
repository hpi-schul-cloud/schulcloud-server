import { Injectable } from '@nestjs/common';
import { EntityId, ShareToken, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
import { ShareTokenContext, ShareTokenPayload } from '../types';
// import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	// constructor(private readonly shareTokenService: ShareTokenService);

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareToken> {
		const shareToken = new ShareToken({
			token,
			parentType: ShareTokenParentType.Course,
			parentId: new ObjectId(),
		});

		return Promise.resolve(shareToken);
	}

	async generateShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareToken> {
		const shareToken = new ShareToken({
			token: 'abcdefg',
			parentType: ShareTokenParentType.Course,
			parentId: new ObjectId(),
		});

		return Promise.resolve(shareToken);
	}
}
