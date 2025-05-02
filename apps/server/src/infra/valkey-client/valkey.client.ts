import { Redis } from 'iovalkey';
import { StorageClient } from './types';

export class ValkeyClient implements StorageClient {
	constructor(private readonly redisInstance: Redis) {}

	public async get(key: string): Promise<string | null> {
		const result = await this.redisInstance.get(key);

		return result;
	}

	public async set(key: string, value: string, ...args: ['EX', number]): Promise<void> {
		await this.redisInstance.set(key, value, ...args);
	}

	public async del(key: string): Promise<number> {
		const result = await this.redisInstance.del(key);

		return result;
	}

	public async ttl(key: string): Promise<number> {
		const result = await this.redisInstance.ttl(key);

		return result;
	}

	public async keys(pattern: string): Promise<string[]> {
		const result = await this.redisInstance.keys(pattern);

		return result;
	}

	public on(event: string, callback: (...args: unknown[]) => void): void {
		this.redisInstance.on(event, callback);
	}
}
