import { Injectable } from '@nestjs/common';
import { EntityId, Shareable, ShareTokenParentType } from '@shared/domain';
import { ObjectId } from 'bson';
// import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	// constructor(private readonly shareTokenService: ShareTokenService);

	async lookupShareToken(userId: EntityId, token: string): Promise<Shareable> {
		const shareable = new Shareable({
			token,
			parentType: ShareTokenParentType.Course,
			parentId: new ObjectId(),
		});

		return Promise.resolve(shareable);
	}
}
