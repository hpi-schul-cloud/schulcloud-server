export interface CacheConfig {
	REDIS_CLUSTER_ENABLED: boolean;
	REDIS_URI: string;
	REDIS_SENTINEL_NAME: string;
	REDIS_SENTINEL_PASSWORD: string;
	REDIS_SENTINEL_SERVICE_NAME: string;
}
