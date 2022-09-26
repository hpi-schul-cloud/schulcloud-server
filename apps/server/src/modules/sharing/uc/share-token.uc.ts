import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, ShareTokenContext, ShareTokenDO, ShareTokenPayload } from '@shared/domain';
import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	constructor(private readonly shareTokenService: ShareTokenService) {}

	lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenDO> {
		throw new NotImplementedException();
	}

	createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		throw new NotImplementedException();
	}
}
