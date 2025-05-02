export interface StorageClient {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ...args: ['EX', number]): Promise<void>;
	del(key: string): Promise<number>;
	ttl(key: string): Promise<number>;
	keys(pattern: string): Promise<string[]>;
	on(event: string, callback: (...args: unknown[]) => void): void;
}
