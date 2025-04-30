import { LegacyLogger } from '@core/logger';
import * as dns from 'dns';
import Redis from 'iovalkey';
import * as util from 'util';
import { ValkeyConfig } from './valkey.config';

export class ValkeyFactory {
	public static async build(config: ValkeyConfig, logger: LegacyLogger): Promise<Redis> {
		let redisInstance: Redis;

		if (config.CLUSTER_ENABLED) {
			redisInstance = await ValkeyFactory.createValkeySentinelInstance(config, logger);
		} else if (config.URI) {
			redisInstance = ValkeyFactory.createNewValkeyInstance(config);
		} else {
			throw new Error('No Redis URI provided and Redis cluster is not enabled.');
		}

		redisInstance.on('error', (error) => logger.error(error));
		redisInstance.on('connect', (msg) => logger.log(msg));

		return redisInstance;
	}

	private static createNewValkeyInstance(config: ValkeyConfig): Redis {
		const redisUri = ValkeyFactory.checkRedisConfig(config);
		const redisInstance = new Redis(redisUri);

		return redisInstance;
	}

	private static async createValkeySentinelInstance(config: ValkeyConfig, logger: LegacyLogger): Promise<Redis> {
		const { sentinelName, sentinelPassword } = ValkeyFactory.checkSentinalConfig(config);
		const sentinels = await ValkeyFactory.discoverSentinelHosts(config, logger);

		const redisInstance = new Redis({
			sentinels,
			sentinelPassword,
			password: sentinelPassword,
			name: sentinelName,
		});

		return redisInstance;
	}

	private static async discoverSentinelHosts(
		config: ValkeyConfig,
		logger: LegacyLogger
	): Promise<{ host: string; port: number }[]> {
		const serviceName = config.SENTINEL_SERVICE_NAME;
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

			logger.log(`Discovered sentinels: ${JSON.stringify(hosts)}`);

			return hosts;
		} catch (err) {
			// TODO: Log or throw but not both, but i think the try catch must place in createValkeySentinelInstance, similar the try catch in createNewValkeyInstance is missed,
			// or only one try catch in build
			logger.log('Error during service discovery:');
			throw err;
		}
	}

	private static checkSentinalConfig(config: ValkeyConfig): { sentinelName: string; sentinelPassword: string } {
		const sentinelName = config.SENTINEL_NAME;
		const sentinelPassword = config.SENTINEL_PASSWORD;

		if (!sentinelName) {
			throw new Error('SENTINEL_NAME is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelPassword) {
			throw new Error('SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance');
		}

		return { sentinelName, sentinelPassword };
	}

	private static checkRedisConfig(config: ValkeyConfig): string {
		if (!config.URI) {
			throw new Error('URI is required for creating a new Valkey instance');
		}

		return config.URI;
	}
}
