import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import * as dns from 'dns';
import Valkey from 'iovalkey';
import * as util from 'util';
import { ConnectedLoggable, DiscoveredSentinalHostsLoggable } from './loggable';
import { SentinalHost } from './types';
import { ValkeyConfig, ValkeyMode } from './valkey.config';

export class ValkeyFactory {
	public static async create(
		valkeyConfig: ValkeyConfig,
		logger: Logger,
		domainErrorHandler: DomainErrorHandler
	): Promise<Valkey> {
		let storageClient: Valkey;

		if (valkeyConfig.MODE === ValkeyMode.CLUSTER) {
			storageClient = await ValkeyFactory.createValkeySentinelInstance(valkeyConfig, logger);
		} else if (valkeyConfig.MODE === ValkeyMode.SINGLE) {
			storageClient = ValkeyFactory.createNewValkeyInstance(valkeyConfig.URI);
		} else {
			throw new Error(`Undefined valkey mode ${JSON.stringify(valkeyConfig.MODE)}`);
		}

		storageClient.on('error', (error) => {
			domainErrorHandler.exec(error);
		});
		storageClient.on('connect', (msg: unknown) => {
			logger.info(new ConnectedLoggable(msg));
		});

		return storageClient;
	}

	private static createNewValkeyInstance(uri?: string): Valkey {
		const validatedUri = ValkeyFactory.checkRedisURI(uri);
		try {
			const valkeyInstance = new Valkey(validatedUri);

			return valkeyInstance;
		} catch (err) {
			throw new Error(
				`Can not create valkey "sentinal" instance.
					If you are on macOS and using Telepresence, DNS resolution may be broken.
					See: https://telepresence.io/docs/troubleshooting#dns-is-broken-on-macos
					You could use directly add the IPs discoverSentinelHosts below, and also for MongoDB in your /etc/hosts`,
				{ cause: err }
			);
		}
	}

	private static async createValkeySentinelInstance(config: ValkeyConfig, logger: Logger): Promise<Valkey> {
		const { sentinelName, sentinelPassword, sentinalServiceName } = ValkeyFactory.checkSentinelConfig(config);
		try {
			const sentinels = await ValkeyFactory.discoverSentinelHosts(sentinalServiceName);
			logger.info(new DiscoveredSentinalHostsLoggable(sentinels));

			const sentinelsConfig = {
				sentinels,
				sentinelPassword,
				password: sentinelPassword,
				name: sentinelName,
			};

			const valkeyInstance = new Valkey(sentinelsConfig);

			return valkeyInstance;
		} catch (err) {
			throw new Error('Can not create valkey "sentinal" instance.', { cause: err });
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

	private static checkRedisURI(redisUri?: string): string {
		const redisUriExpValidation = /^(redis:\/\/|rediss:\/\/)([a-zA-Z0-9._-]+(:\d{1,5})?)(\/([a-zA-Z0-9._-]+))?$/;
		if (redisUri && redisUriExpValidation.test(redisUri)) {
			return redisUri;
		}
		throw new Error('URI is not valid');
	}
}
