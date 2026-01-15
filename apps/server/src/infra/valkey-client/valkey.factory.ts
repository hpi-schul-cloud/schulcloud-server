import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import * as dns from 'dns';
import Valkey from 'iovalkey';
import * as util from 'util';
import { InMemoryClient, ValkeyClient } from './clients';
import { ConnectedLoggable, DiscoveredSentinalHostsLoggable } from './loggable';
import { SentinalHost, StorageClient } from './types';
import { ValkeyConfig, ValkeyMode } from './valkey.config';

export class ValkeyFactory {
	public static async build(
		valkeyConfig: ValkeyConfig,
		logger: Logger,
		domainErrorHandler: DomainErrorHandler
	): Promise<StorageClient> {
		let storageClient: StorageClient;

		if (valkeyConfig.mode === ValkeyMode.CLUSTER) {
			storageClient = await ValkeyFactory.createValkeySentinelInstance(valkeyConfig, logger);
		} else if (valkeyConfig.mode === ValkeyMode.SINGLE) {
			storageClient = ValkeyFactory.createNewValkeyInstance(valkeyConfig.uri);
		} else if (valkeyConfig.mode === ValkeyMode.IN_MEMORY) {
			storageClient = ValkeyFactory.createInMemoryInstance(logger);
		} else {
			throw new Error(`Undefined valkey mode ${JSON.stringify(valkeyConfig.mode)}`);
		}

		storageClient.on('error', (error) => {
			domainErrorHandler.exec(error);
		});
		storageClient.on('connect', (msg: unknown) => {
			logger.info(new ConnectedLoggable(msg));
		});

		return storageClient;
	}

	private static createInMemoryInstance(logger: Logger): StorageClient {
		const inMemoryClientInstance = new InMemoryClient(logger);

		return inMemoryClientInstance;
	}

	private static createNewValkeyInstance(uri?: string): ValkeyClient {
		const validatedUri = ValkeyFactory.checkRedisURI(uri);
		try {
			const valkeyInstance = new Valkey(validatedUri);
			const valkeyClientInstance = new ValkeyClient(valkeyInstance);

			return valkeyClientInstance;
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

	private static async createValkeySentinelInstance(config: ValkeyConfig, logger: Logger): Promise<ValkeyClient> {
		const { sentinelName, sentinelPassword, sentinelServiceName } = ValkeyFactory.checkSentinelConfig(config);
		try {
			const sentinels = await ValkeyFactory.discoverSentinelHosts(sentinelServiceName);
			logger.info(new DiscoveredSentinalHostsLoggable(sentinels));

			const sentinelsConfig = {
				sentinels,
				sentinelPassword,
				password: sentinelPassword,
				name: sentinelName,
			};

			const valkeyInstance = new Valkey(sentinelsConfig);
			const valkeyClientInstance = new ValkeyClient(valkeyInstance);

			return valkeyClientInstance;
		} catch (err) {
			throw new Error('Can not create valkey "sentinel" instance.', { cause: err });
		}
	}

	private static async discoverSentinelHosts(sentinelServiceName: string): Promise<SentinalHost[]> {
		const resolveSrv = util.promisify(dns.resolveSrv);
		const records = await resolveSrv(sentinelServiceName);

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
		sentinelServiceName: string;
	} {
		const { sentinelName, sentinelPassword, sentinelServiceName } = config;

		if (!sentinelName) {
			throw new Error('sentinelName is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelPassword) {
			throw new Error('sentinelPassword is required for creating a Valkey Sentinel instance');
		}

		if (!sentinelServiceName) {
			throw new Error('sentinelServiceName is required for service discovery');
		}

		return { sentinelName, sentinelPassword, sentinelServiceName };
	}

	private static checkRedisURI(redisUri?: string): string {
		const redisUriExpValidation = /^(redis:\/\/|rediss:\/\/)([a-zA-Z0-9._-]+(:\d{1,5})?)(\/([a-zA-Z0-9._-]+))?$/;
		if (redisUri && redisUriExpValidation.test(redisUri)) {
			return redisUri;
		}
		throw new Error('uri is not valid');
	}
}
