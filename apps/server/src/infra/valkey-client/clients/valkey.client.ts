import type Valkey from 'iovalkey';
import { StorageClient } from '../types';

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

	public emit(event: string, ...args: unknown[]): boolean {
		return this.valkeyInstance.emit(event, args);
	}
}
