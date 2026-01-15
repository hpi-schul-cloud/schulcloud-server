import { ConfigProperty, Configuration } from '@infra/configuration';

export enum ValkeyMode {
	CLUSTER = 'cluster',
	SINGLE = 'single',
	IN_MEMORY = 'in-memory',
}

export interface ValkeyConfig {
	mode: ValkeyMode;
	uri?: string;
	sentinelName?: string;
	sentinelPassword?: string;
	sentinelServiceName?: string;
}

export const IN_MEMORY_VALKEY_CLIENT_CONFIG = 'IN_MEMORY_VALKEY_CLIENT_CONFIG';

@Configuration()
export class InMemoryConfig {
	@ConfigProperty()
	public mode = ValkeyMode.IN_MEMORY;
}

export const VALKEY_CLIENT_CONFIG_TOKEN = 'VALKEY_CLIENT_CONFIG_TOKEN';

@Configuration()
export class InMemoryConfig {
	@ConfigProperty()
	public MODE = ValkeyMode.IN_MEMORY;
}
