import { Logger } from '@core/logger';
import { InMemoryLoggable } from '../loggable';
import { StorageClient } from '../types';
import EventEmitter from 'events';

export class InMemoryClient extends EventEmitter implements StorageClient {
	private readonly store: Record<string, string> = {};
	private readonly ttlStore: Record<string, number> = {};

	constructor(private readonly logger: Logger) {
		super();
	}

	public set(key: string, value: string, ...args: unknown[]): Promise<void> {
		this.store[key] = value;
		const ex = args.indexOf('EX');
		if (ex >= 0) {
			this.ttlStore[key] = Date.now() + Number(args[ex + 1]) * 1000;
		}

		this.logger.warning(new InMemoryLoggable(`SET - Key: ${key} - Value: ${value}`));

		return Promise.resolve();
	}

	public get(key: string): Promise<string | null> {
		this.logger.warning(new InMemoryLoggable(`GET - Key: ${key} - Value: ${this.store[key]}`));

		if (this.ttlStore[key] < Date.now()) {
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
		this.logger.warning(new InMemoryLoggable(`DELETE - Key: ${key} - Value: ${this.store[key]}`));

		return Promise.resolve(length);
	}

	public keys(pattern: string): Promise<string[]> {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'));
		this.logger.warning(new InMemoryLoggable(`Pattern: ${pattern}`));

		return Promise.resolve(Object.keys(this.store).filter((key) => regex.test(key)));
	}

	public ttl(key: string): Promise<number> {
		this.logger.warning(new InMemoryLoggable(`TTL - Key: ${key} - TTL: ${this.ttlStore[key]}`));

		return Promise.resolve(this.ttlStore[key] ?? -1);
	}
}
