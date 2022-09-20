import { Injectable } from '@nestjs/common';
import { EntityId, ShareToken, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
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
}
