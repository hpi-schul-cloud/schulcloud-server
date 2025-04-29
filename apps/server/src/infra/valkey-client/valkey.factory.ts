import { LegacyLogger } from '@core/logger';
import * as dns from 'dns';
import Redis from 'iovalkey';
import * as util from 'util';
import { ValkeyConfig } from './valkey.config';

export class ValkeyFactory {
	private static logger: LegacyLogger;
	private static config: ValkeyConfig;

	public static async build(config: ValkeyConfig, logger: LegacyLogger): Promise<Redis> {
		ValkeyFactory.config = config;
		ValkeyFactory.logger = logger;
		ValkeyFactory.logger.setContext(Redis.name);

		let redisInstance: Redis;

		if (ValkeyFactory.config.CLUSTER_ENABLED) {
			redisInstance = await ValkeyFactory.createValkeySentinelInstance();
		} else if (ValkeyFactory.config.URI) {
			redisInstance = ValkeyFactory.createNewValkeyInstance();
		} else {
			throw new Error('No Redis URI provided and Redis cluster is not enabled.');
		}

		redisInstance.on('error', (error) => ValkeyFactory.logger.error(error));
		redisInstance.on('connect', (msg) => ValkeyFactory.logger.log(msg));

		return redisInstance;
	}

	private static createNewValkeyInstance(): Redis {
		const redisUri = ValkeyFactory.config.URI;
		if (!redisUri) {
			throw new Error('URI is required for creating a new Valkey instance');
		}

		const redisInstance = new Redis(redisUri);

		return redisInstance;
	}

	private static async createValkeySentinelInstance(): Promise<Redis> {
		const sentinelName = ValkeyFactory.config.SENTINEL_NAME;
		const sentinelPassword = ValkeyFactory.config.SENTINEL_PASSWORD;

		if (!sentinelName) {
			throw new Error('SENTINEL_NAME is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelPassword) {
			throw new Error('SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance');
		}

		const sentinels = await ValkeyFactory.discoverSentinelHosts();
		ValkeyFactory.logger.log(`Discovered sentinels: ${JSON.stringify(sentinels)}`);

		const redisInstance = new Redis({
			sentinels,
			sentinelPassword,
			password: sentinelPassword,
			name: sentinelName,
		});

		return redisInstance;
	}

	private static async discoverSentinelHosts(): Promise<{ host: string; port: number }[]> {
		const serviceName = ValkeyFactory.config.SENTINEL_SERVICE_NAME;
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
			ValkeyFactory.logger.log('Error during service discovery:');
			throw err;
		}
	}
}
