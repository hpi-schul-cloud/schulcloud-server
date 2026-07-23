import { type Logger } from '@infra/logger';
import { type StorageClient } from '../types';
import EventEmitter from 'node:events';
import { InMemoryLoggable } from '../loggable';

type StoreEntry = { value: string; expiresAt?: number };

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
			this.store[key] = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
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
		const now = Date.now();
		const keys = Object.entries(this.store)
			.filter(([, entry]) => entry.expiresAt === undefined || entry.expiresAt >= now)
			.map(([key]) => key)
			.filter((key) => regex.test(key));

		return Promise.resolve(keys);
	}

	public ttl(key: string): Promise<number> {
		const entry = this.store[key];

		if (entry === undefined) {
			this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: -2`));
			return Promise.resolve(-2);
		}

		if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
			delete this.store[key];
			this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: -2 (expired)`));
			return Promise.resolve(-2);
		}

		if (entry.expiresAt === undefined) {
			this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: -1`));
			return Promise.resolve(-1);
		}

		const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
		this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: ${remaining}`));

		return Promise.resolve(remaining);
	}
}
