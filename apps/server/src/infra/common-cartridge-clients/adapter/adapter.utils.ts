import { RawAxiosRequestConfig } from 'axios';

export class AdapterUtils {
	public static createAxiosConfigForJwt(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
