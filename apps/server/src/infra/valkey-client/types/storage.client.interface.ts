export interface StorageClient {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttlSeconds?: number): Promise<void>;
	del(key: string): Promise<number>;
	ttl(key: string): Promise<number>;
	keys(pattern: string): Promise<string[]>;
	on(event: 'error', callback: (err: Error) => void): void;
	on(event: 'connect', callback: (msg: unknown) => void): void;
}
