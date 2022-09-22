import { Injectable } from '@nestjs/common';
import { ShareTokenContext, ShareTokenDO, ShareTokenPayload, ShareTokenString } from '@shared/domain';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { TokenGenerator } from './token-generator.service';

@Injectable()
export class ShareTokenService {
	constructor(private readonly tokenGenerator: TokenGenerator, private readonly shareTokenRepo: ShareTokenRepo) {}

	async createToken(
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenString> {
		const token = this.tokenGenerator.generateShareToken();

		const shareToken = new ShareTokenDO({
			token,
			payload,
			context: options?.context,
			expiresAt: options?.expiresAt,
		});

		await this.shareTokenRepo.save(shareToken);

		return token;
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
