import { randomUUID } from 'crypto';
import { AccessToken } from '../vo';

export class AccessTokenBuilder {
	public static build(): AccessToken {
		const token = randomUUID();
		const accessToken = new AccessToken(token);

		return accessToken;
	}
}
