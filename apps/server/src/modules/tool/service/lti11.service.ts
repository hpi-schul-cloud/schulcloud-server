import OAuth from 'oauth-1.0a';
import { LtiPrivacyPermission, PseudonymDO } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { PseudonymsRepo } from '@shared/repo';
import CryptoJS from 'crypto-js';

@Injectable()
export class Lti11Service {
	constructor(private readonly pseudonymRepo: PseudonymsRepo) {}

	createConsumer(ltiKey: string, ltiSecret: string): OAuth {
		const oauth: OAuth = new OAuth({
			consumer: {
				key: ltiKey,
				secret: ltiSecret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function: (base_string: string, key: string) =>
				CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64),
		});
		return oauth;
	}

	async getUserIdOrPseudonym(userId: string, toolId: string, options: LtiPrivacyPermission): Promise<string> {
		if (options === LtiPrivacyPermission.PSEUDONYMOUS) {
			const pseudonym: PseudonymDO = await this.pseudonymRepo.findByUserIdAndToolId(userId, toolId);
			return pseudonym.pseudonym;
		}
		return userId;
	}
}
