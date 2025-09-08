import { Injectable } from '@nestjs/common';
import CryptoJS from 'crypto-js';
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
				CryptoJS.HmacSHA1(base_string, hashKey).toString(CryptoJS.enc.Base64),
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
