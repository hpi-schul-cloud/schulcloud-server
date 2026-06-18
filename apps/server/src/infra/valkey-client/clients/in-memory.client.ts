import { Logger } from '@core/logger';
import EventEmitter from 'node:events';
import { InMemoryLoggable } from '../loggable';
import { StorageClient } from '../types';

const store: Record<string, string> = {};
const ttlStore: Record<string, { expiresAt: number; ttl: number }> = {};

export class InMemoryClient extends EventEmitter implements StorageClient {
	constructor(private readonly logger: Logger) {
		super();
	}

	public set(key: string, value: string, ...args: unknown[]): Promise<void> {
		store[key] = value;
		const ex = args.indexOf('EX');
		if (ex >= 0) {
			const ttlValue = Number(args[ex + 1]);
			ttlStore[key] = { expiresAt: Date.now() + ttlValue * 1000, ttl: ttlValue };
		}

		this.logger.warning(new InMemoryLoggable(`SET - Key: ${key} - Value: ${value}`));

		return Promise.resolve();
	}

	public get(key: string): Promise<string | null> {
		this.logger.warning(new InMemoryLoggable(`GET - Key: ${key} - Value: ${store[key]}`));

		if (ttlStore[key]?.expiresAt < Date.now()) {
			return Promise.resolve(null);
		}

		return Promise.resolve(store[key] ?? null);
	}

	public del(key: string): Promise<number> {
		let length = 0;
		if (store[key]) {
			delete store[key];
			delete ttlStore[key];
			length = 1;
		}
		this.logger.warning(new InMemoryLoggable(`DELETE - Key: ${key} - Value: ${store[key]}`));

		return Promise.resolve(length);
	}

	public keys(pattern: string): Promise<string[]> {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'));
		this.logger.warning(new InMemoryLoggable(`Pattern: ${pattern}`));

		return Promise.resolve(Object.keys(store).filter((key) => regex.test(key)));
	}

	public ttl(key: string): Promise<number> {
		this.logger.warning(new InMemoryLoggable(`TTL - Key: ${key} - TTL: ${ttlStore[key]?.ttl}`));

		return Promise.resolve(ttlStore[key]?.ttl ?? -1);
	}
}
