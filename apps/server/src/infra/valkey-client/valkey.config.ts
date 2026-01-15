import { ConfigProperty, Configuration } from '@infra/configuration';

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

export const IN_MEMORY_VALKEY_CLIENT_CONFIG = 'IN_MEMORY_VALKEY_CLIENT_CONFIG';

@Configuration()
export class InMemoryConfig {
	@ConfigProperty()
	public MODE = ValkeyMode.IN_MEMORY;
}
