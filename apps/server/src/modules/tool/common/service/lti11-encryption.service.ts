import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';

@Injectable()
export class Lti11EncryptionService {
	public sign(key: string, secret: string, url: string, payload: unknown): Authorization {
		const requestData: RequestOptions = {
			url,
			method: 'POST',
			data: payload,
		};

		const consumer: OAuth = new OAuth({
			consumer: {
				key,
				secret,
			},
			signature_method: 'HMAC-SHA1',
			hash_function: (base_string: string, hashKey: string) =>
				crypto.createHmac('sha1', hashKey).update(base_string).digest('base64'),
		});

		const authorization: Authorization = consumer.authorize(requestData);

		return authorization;
	}

	public verify(key: string, secret: string, url: string, payload: Authorization): boolean {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { oauth_signature, ...validationPayload } = payload;

		const authorization: Authorization = this.sign(key, secret, url, validationPayload);

		const isValid = oauth_signature === authorization.oauth_signature;

		return isValid;
	}
}
