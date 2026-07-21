import { type StorageClient } from '@shared/domain/interface';
import type Valkey from 'iovalkey';

/**
 *  This class is a wrapper around the Valkey library to provide a consistent interface for storage operations.
 */
export class ValkeyClient implements StorageClient {
	// You can use the Valkey library directly for usage in external packages.
	constructor(public readonly valkeyInstance: Valkey) {}

	public async get(key: string): Promise<string | null> {
		const result = await this.valkeyInstance.get(key);

		return result;
	}

	public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
		if (ttlSeconds !== undefined) {
			await this.valkeyInstance.set(key, value, 'EX', ttlSeconds);
		} else {
			await this.valkeyInstance.set(key, value);
		}
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

	public on(event: 'error', callback: (err: Error) => void): void;
	public on(event: 'connect', callback: (msg: unknown) => void): void;
	public on(event: string, callback: ((err: Error) => void) | ((msg: unknown) => void)): void {
		this.valkeyInstance.on(event, callback);
	}

	public emit(event: 'error', err: Error): boolean;
	public emit(event: 'connect'): boolean;
	public emit(event: string, ...args: [Error] | []): boolean {
		return this.valkeyInstance.emit(event, ...args);
	}
}
