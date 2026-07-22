import { type Logger } from '@infra/logger';
import { type StorageClient } from '../types';
import EventEmitter from 'node:events';
import { InMemoryLoggable } from '../loggable';

type StoreEntry = { value: string; expiresAt?: number; ttl?: number };

export class InMemoryClient extends EventEmitter implements StorageClient {
	private store: Record<string, StoreEntry> = {};
	private static instance: InMemoryClient | null = null;

	public static getInstance(logger: Logger): InMemoryClient {
		InMemoryClient.instance ??= new InMemoryClient(logger);

		return InMemoryClient.instance;
	}

	private constructor(private readonly logger: Logger) {
		super();
	}

	public set(key: string, value: string, ttlSeconds?: number): Promise<void> {
		if (ttlSeconds !== undefined) {
			this.store[key] = { value, expiresAt: Date.now() + ttlSeconds * 1000, ttl: ttlSeconds };
		} else {
			this.store[key] = { value };
		}

		this.logger.info(new InMemoryLoggable(`SET - Key: ${key} - Value: ${value}`));

		return Promise.resolve();
	}

	public get(key: string): Promise<string | null> {
		const entry = this.store[key];

		this.logger.info(new InMemoryLoggable(`GET - Key: ${key} - Value: ${entry?.value}`));

		if (entry === undefined) {
			return Promise.resolve(null);
		}

		if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
			delete this.store[key];
			return Promise.resolve(null);
		}

		return Promise.resolve(entry.value);
	}

	public del(key: string): Promise<number> {
		let length = 0;
		if (this.store[key] !== undefined) {
			delete this.store[key];
			length = 1;
		}
		this.logger.info(new InMemoryLoggable(`DELETE - Key: ${key}`));

		return Promise.resolve(length);
	}

	public keys(pattern: string): Promise<string[]> {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'));
		this.logger.info(new InMemoryLoggable(`Pattern: ${pattern}`));

		return Promise.resolve(Object.keys(this.store).filter((key) => regex.test(key)));
	}

	public ttl(key: string): Promise<number> {
		const ttl = this.store[key]?.ttl;
		this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: ${ttl}`));

		return Promise.resolve(ttl ?? -1);
	}
}
