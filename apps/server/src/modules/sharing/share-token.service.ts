import { Injectable } from '@nestjs/common';
import { ShareToken, ShareTokenString } from '@shared/domain';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { TokenGenerator } from './token-generator.service';
import { ShareTokenContext, ShareTokenPayload } from './types';

@Injectable()
export class ShareTokenService {
	constructor(private readonly tokenGenerator: TokenGenerator, private readonly shareTokenRepo: ShareTokenRepo) {}

	async createToken(
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenString> {
		const token = this.tokenGenerator.generateShareToken();
		const shareToken = new ShareToken({
			token,
			parentId: payload.parentId,
			parentType: payload.parentType,
			contextId: options?.context?.contextId,
			contextType: options?.context?.contextType,
			expiresAt: options?.expiresAt,
		});

		await this.shareTokenRepo.save(shareToken);

		return token;
	}

	async lookupToken(token: ShareTokenString): Promise<ShareToken> {
		const shareToken = await this.shareTokenRepo.findOneByToken(token);

		this.checkExpired(shareToken);

		return shareToken;
	}

	private checkExpired(shareToken: ShareToken) {
		if (shareToken.expiresAt != null && shareToken.expiresAt < new Date(Date.now())) {
			throw new Error('Share token expired');
		}
	}
}
