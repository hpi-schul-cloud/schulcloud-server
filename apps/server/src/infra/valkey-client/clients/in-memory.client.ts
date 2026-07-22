import { type Logger } from '@infra/logger';
import { type StorageClient } from '@shared/domain/interface';
import EventEmitter from 'node:events';
import { InMemoryLoggable } from '../loggable';

export class InMemoryClient extends EventEmitter implements StorageClient {
	private store: Record<string, string> = {};
	private ttlStore: Record<string, { expiresAt: number; ttl: number }> = {};
	private static instance: InMemoryClient | null = null;

	public static getInstance(logger: Logger): InMemoryClient {
		InMemoryClient.instance ??= new InMemoryClient(logger);

		return InMemoryClient.instance;
	}

	private constructor(private readonly logger: Logger) {
		super();
	}

	public set(key: string, value: string, ttlSeconds?: number): Promise<void> {
		if (ttlSeconds === undefined) {
			this.store[key] = value;
		} else {
			this.ttlStore[key] = { expiresAt: Date.now() + ttlSeconds * 1000, ttl: ttlSeconds };
		}

		this.logger.info(new InMemoryLoggable(`SET - Key: ${key} - Value: ${value}`));

		return Promise.resolve();
	}

	public get(key: string): Promise<string | null> {
		this.logger.info(new InMemoryLoggable(`GET - Key: ${key} - Value: ${this.store[key]}`));

		if (this.ttlStore[key]?.expiresAt < Date.now()) {
			return Promise.resolve(null);
		}

		return Promise.resolve(this.store[key] ?? null);
	}

	public del(key: string): Promise<number> {
		let length = 0;
		if (this.store[key]) {
			delete this.store[key];
			delete this.ttlStore[key];
			length = 1;
		}
		this.logger.info(new InMemoryLoggable(`DELETE - Key: ${key} - Value: ${this.store[key]}`));

		return Promise.resolve(length);
	}

	public keys(pattern: string): Promise<string[]> {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'));
		this.logger.info(new InMemoryLoggable(`Pattern: ${pattern}`));

		return Promise.resolve(Object.keys(this.store).filter((key) => regex.test(key)));
	}

	public ttl(key: string): Promise<number> {
		this.logger.info(new InMemoryLoggable(`TTL - Key: ${key} - TTL: ${this.ttlStore[key]?.ttl}`));

		return Promise.resolve(this.ttlStore[key]?.ttl ?? -1);
	}
}
