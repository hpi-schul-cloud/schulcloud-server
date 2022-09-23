import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId, ShareTokenContext, ShareTokenDO, ShareTokenPayload } from '@shared/domain';
import { ShareTokenService } from '../share-token.service';

@Injectable()
export class ShareTokenUC {
	constructor(private readonly shareTokenService: ShareTokenService) {}

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenDO> {
		throw new NotImplementedException();

		// WIP add authorization

		const shareToken = await this.shareTokenService.lookupToken(token);

		return shareToken;
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		throw new NotImplementedException();

		// WIP add authorization

		const shareToken = await this.shareTokenService.createToken(payload, options);

		return shareToken;
	}
}
