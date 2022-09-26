import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, ShareTokenContext, ShareTokenDO, ShareTokenPayload } from '@shared/domain';
import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	constructor(private readonly shareTokenService: ShareTokenService) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenDO> {
		return Promise.reject(new NotImplementedException());
	}

	createShareToken(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: EntityId,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		payload: ShareTokenPayload,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		return Promise.reject(new NotImplementedException());
	}
}
