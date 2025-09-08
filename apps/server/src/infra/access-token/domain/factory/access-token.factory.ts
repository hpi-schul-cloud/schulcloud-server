import { AccessToken } from '../vo';

export class AccessTokenFactory {
	public static build(): AccessToken {
		return new AccessToken();
	}
}
