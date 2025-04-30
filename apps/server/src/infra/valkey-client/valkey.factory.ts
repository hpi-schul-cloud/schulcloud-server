import { Logger } from '@core/logger';
import * as dns from 'dns';
import { Redis } from 'iovalkey';
import * as util from 'util';
import { ValkeyConfig } from './valkey.config';
import { DomainErrorHandler } from '@core/error';
import { ConntectedLoggable, DiscoveredSentinalHostsLoggable } from './loggable';
import { SentinalHost } from './types';

export class ValkeyFactory {
	public static async build(
		config: ValkeyConfig,
		logger: Logger,
		domainErrorHandler: DomainErrorHandler
	): Promise<Redis> {
		let redisInstance: Redis;

		if (config.CLUSTER_ENABLED === true) {
			redisInstance = await ValkeyFactory.createValkeySentinelInstance(config, logger);
		} else if (config.URI) {
			redisInstance = ValkeyFactory.createNewValkeyInstance(config);
		} else {
			throw new Error('No Redis URI provided and Redis cluster is not enabled.');
		}

		redisInstance.on('error', (error) => domainErrorHandler.exec(error));
		redisInstance.on('connect', (msg) => logger.info(new ConntectedLoggable(msg)));

		return redisInstance;
	}

	private static createNewValkeyInstance(config: ValkeyConfig): Redis {
		const redisUri = ValkeyFactory.checkRedisConfig(config);
		try {
			const redisInstance = new Redis(redisUri);

			return redisInstance;
		} catch (err) {
			throw new Error('Can not create valky instance.', { cause: err });
		}
	}

	private static async createValkeySentinelInstance(config: ValkeyConfig, logger: Logger): Promise<Redis> {
		const { sentinelName, sentinelPassword, sentinalServiceName } = ValkeyFactory.checkSentinelConfig(config);
		try {
			const sentinels = await ValkeyFactory.discoverSentinelHosts(sentinalServiceName);
			logger.info(new DiscoveredSentinalHostsLoggable(sentinels));

			const redisInstance = new Redis({
				sentinels,
				sentinelPassword,
				password: sentinelPassword,
				name: sentinelName,
			});

			return redisInstance;
		} catch (err) {
			throw new Error('Can not create valky "sentinal" instance.', { cause: err });
		}
	}

	private static async discoverSentinelHosts(sentinalServiceName: string): Promise<SentinalHost[]> {
		const resolveSrv = util.promisify(dns.resolveSrv);
		const records = await resolveSrv(sentinalServiceName);

		const hosts = records.map((record) => {
			return {
				host: record.name,
				port: record.port,
			};
		});

		return hosts;
	}

	private static checkSentinelConfig(config: ValkeyConfig): {
		sentinelName: string;
		sentinelPassword: string;
		sentinalServiceName: string;
	} {
		const sentinelName = config.SENTINEL_NAME;
		const sentinelPassword = config.SENTINEL_PASSWORD;
		const sentinalServiceName = config.SENTINEL_SERVICE_NAME;

		if (!sentinelName) {
			throw new Error('SENTINEL_NAME is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelPassword) {
			throw new Error('SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance');
		}

		if (!sentinalServiceName) {
			throw new Error('SENTINEL_SERVICE_NAME is required for service discovery');
		}

		return { sentinelName, sentinelPassword, sentinalServiceName };
	}

	private static checkRedisConfig(config: ValkeyConfig): string {
		if (!config.URI) {
			throw new Error('URI is required for creating a new Valkey instance');
		}

		return config.URI;
	}
}
