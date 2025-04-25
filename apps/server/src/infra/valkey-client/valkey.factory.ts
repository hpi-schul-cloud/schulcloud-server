import { LegacyLogger } from '@core/logger';
import * as dns from 'dns';
import Redis from 'iovalkey';
import * as util from 'util';
import { ValkeyConfig } from './valkey.config';

export class ValkeyFactory {
	private static logger: LegacyLogger;
	private static config: ValkeyConfig;

	public static async build(config: ValkeyConfig, logger: LegacyLogger): Promise<Redis> {
		this.config = config;
		this.logger = logger;
		this.logger.setContext(Redis.name);

		let redisInstance: Redis;

		if (this.config.CLUSTER_ENABLED) {
			redisInstance = await this.createValkeySentinelInstance();
		} else if (this.config.URI) {
			redisInstance = this.createNewValkeyInstance();
		} else {
			throw new Error('No Redis URI provided and Redis cluster is not enabled.');
		}

		redisInstance.on('error', (error) => this.logger.error(error));
		redisInstance.on('connect', (msg) => this.logger.log(msg));

		return redisInstance;
	}

	private static createNewValkeyInstance(): Redis {
		const redisUri = this.config.URI;
		if (!redisUri) {
			throw new Error('URI is required for creating a new Valkey instance');
		}

		const redisInstance = new Redis(redisUri);

		return redisInstance;
	}

	private static async createValkeySentinelInstance(): Promise<Redis> {
		const sentinelName = this.config.SENTINEL_NAME;
		const sentinelPassword = this.config.SENTINEL_PASSWORD;

		if (!sentinelName) {
			throw new Error('SENTINEL_NAME is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelPassword) {
			throw new Error('SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance');
		}

		const sentinels = await this.discoverSentinelHosts();
		this.logger.log(`Discovered sentinels: ${JSON.stringify(sentinels)}`);

		const redisInstance = new Redis({
			sentinels,
			sentinelPassword,
			password: sentinelPassword,
			name: sentinelName,
		});

		return redisInstance;
	}

	private static async discoverSentinelHosts(): Promise<{ host: string; port: number }[]> {
		const serviceName = this.config.SENTINEL_SERVICE_NAME;
		if (!serviceName) {
			throw new Error('SENTINEL_SERVICE_NAME is required for service discovery');
		}

		const resolveSrv = util.promisify(dns.resolveSrv);
		try {
			const records = await resolveSrv(serviceName);

			const hosts = records.map((record) => {
				return {
					host: record.name,
					port: record.port,
				};
			});

			return hosts;
		} catch (err) {
			this.logger.log('Error during service discovery:');
			throw err;
		}
	}
}
