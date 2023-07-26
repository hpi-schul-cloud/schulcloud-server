import { Injectable } from '@nestjs/common';
import CryptoJS from 'crypto-js';
import OAuth, { Authorization, RequestOptions } from 'oauth-1.0a';

@Injectable()
export class Lti11EncryptionService {
	public sign(key: string, secret: string, url: string, payload: Record<string, string>): Authorization {
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
}
