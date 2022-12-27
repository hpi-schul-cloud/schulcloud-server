import { Injectable } from '@nestjs/common';
import { ShareTokenContext, ShareTokenDO, ShareTokenPayload, ShareTokenString } from '../domainobject/share-token.do';
import { ShareTokenRepo } from '../repo/share-token.repo';
import { TokenGenerator } from './token-generator.service';

@Injectable()
export class ShareTokenService {
	constructor(private readonly tokenGenerator: TokenGenerator, private readonly shareTokenRepo: ShareTokenRepo) {}

	async createToken(
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		const token: string = this.tokenGenerator.generateShareToken();
		const shareToken = new ShareTokenDO({
			token,
			payload,
			context: options?.context,
			expiresAt: options?.expiresAt,
		});

		await this.shareTokenRepo.save(shareToken);

		return shareToken;
	}

	async lookupToken(token: ShareTokenString): Promise<ShareTokenDO> {
		const shareToken = await this.shareTokenRepo.findOneByToken(token);

		this.checkExpired(shareToken);

		return shareToken;
	}

	private checkExpired(shareToken: ShareTokenDO) {
		if (shareToken.expiresAt != null && shareToken.expiresAt < new Date(Date.now())) {
			throw new Error('Share token expired');
		}
	}
}
