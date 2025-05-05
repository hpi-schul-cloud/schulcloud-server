export enum ValkeyMode {
	CLUSTER = 'cluster',
	SINGLE = 'single',
	IN_MEMORY = 'in-memory',
}

export interface ValkeyConfig {
	MODE: ValkeyMode;
	URI?: string;
	SENTINEL_NAME?: string;
	SENTINEL_PASSWORD?: string;
	SENTINEL_SERVICE_NAME?: string;
}
