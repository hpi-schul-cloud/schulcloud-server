import { Injectable } from '@nestjs/common';
import { Shareable, ShareToken } from '@shared/domain';
import { ShareableRepo } from '@shared/repo/shareable';
import { TokenGenerator } from './token-generator.service';
import { ShareTokenContext, ShareTokenPayload } from './types';

@Injectable()
export class ShareTokenService {
	constructor(private readonly tokenGenerator: TokenGenerator, private readonly shareableRepo: ShareableRepo) {}

	async createToken(
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareToken> {
		const token = this.tokenGenerator.generateShareToken();
		const shareable = new Shareable({
			token,
			parentId: payload.id,
			parentType: payload.type,
			contextId: options?.context?.id,
			contextType: options?.context?.type,
			expiresAt: options?.expiresAt,
		});

		await this.shareableRepo.save(shareable);

		return token;
	}

	async lookupToken(shareToken: ShareToken): Promise<Shareable> {
		const shareable = await this.shareableRepo.findOneByToken(shareToken);

		this.checkExpired(shareable);

		return shareable;
	}

	private checkExpired(shareable: Shareable) {
		if (shareable.expiresAt != null && shareable.expiresAt < new Date(Date.now())) {
			throw new Error('Share token expired');
		}
	}
}
