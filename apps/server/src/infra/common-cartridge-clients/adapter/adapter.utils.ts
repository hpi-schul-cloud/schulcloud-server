import { RawAxiosRequestConfig } from 'axios';

export class AdapterUtils {
	public static readonly DEFAULT_MAX_RETRIES: number = 7;
	public static readonly DEFAULT_RETRY_DELAY: number = 1000;

	public static createAxiosConfigForJwt(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}

	public static async retry<T>(
		callId: string,
		fn: () => Promise<T>,
		retries = AdapterUtils.DEFAULT_MAX_RETRIES,
		delayMs = AdapterUtils.DEFAULT_RETRY_DELAY
	): Promise<T> {
		let lastError: unknown;
		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				return await fn();
			} catch (err) {
				lastError = err;
				// Optional: Log für Debugging
				console.warn(`Retry attempt ${attempt + 1} of '${callId}' failed:`, err);
				await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
			}
		}
		throw lastError;
	}
}
