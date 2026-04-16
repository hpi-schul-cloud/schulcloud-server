import { RawAxiosRequestConfig } from 'axios';

export type RetryCallback = (attempt: number, callId: string, err: unknown) => void;

export class AdapterUtils {

	public static createAxiosConfigForJwt(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
