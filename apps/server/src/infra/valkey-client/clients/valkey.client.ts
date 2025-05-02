import type Valkey from 'iovalkey';
import { StorageClient } from '../types';

export class ValkeyClient implements StorageClient {
	constructor(private readonly valkeyInstance: Valkey) {}

	public async get(key: string): Promise<string | null> {
		const result = await this.valkeyInstance.get(key);

		return result;
	}

	public async set(key: string, value: string, ...args: ['EX', number]): Promise<void> {
		await this.valkeyInstance.set(key, value, ...args);
	}

	public async del(key: string): Promise<number> {
		const result = await this.valkeyInstance.del(key);

		return result;
	}

	public async ttl(key: string): Promise<number> {
		const result = await this.valkeyInstance.ttl(key);

		return result;
	}

	public async keys(pattern: string): Promise<string[]> {
		const result = await this.valkeyInstance.keys(pattern);

		return result;
	}

	public on(event: string, callback: (...args: unknown[]) => void): void {
		this.valkeyInstance.on(event, callback);
	}
}
