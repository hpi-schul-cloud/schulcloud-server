import { SentinalHost } from '@infra/valkey-client/types';
import KeyvValkey from '@keyv/valkey';
import { Cache, createCache } from 'cache-manager';
import * as dns from 'dns';
import Keyv from 'keyv';
import * as util from 'util';
import { CacheMode, H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig } from '../h5p-cache.config';

export const H5P_CACHE_PROVIDER_TOKEN = 'H5P_CACHE_PROVIDER_TOKEN';

export const H5PCacheProvider = {
	provide: H5P_CACHE_PROVIDER_TOKEN,
	inject: [H5P_CACHE_CONFIG_TOKEN],
	async useFactory(cacheConfig: H5PCacheConfig): Promise<Cache> {
		const stores: Keyv<KeyvValkey>[] = [];
		if (cacheConfig.mode === CacheMode.CLUSTER) {
			const valkeyInstance = await createValkeySentinelInstance(cacheConfig);
			stores.push(new Keyv(valkeyInstance));
		}
		if (cacheConfig.mode === CacheMode.SINGLE) {
			stores.push(new Keyv(createNewValkeyInstance(cacheConfig)));
		}

		const cacheAdapter = createCache({
			stores,
		});

		return cacheAdapter;
	},
};

function createNewValkeyInstance(config: H5PCacheConfig): KeyvValkey {
	try {
		const valkeyInstance = new KeyvValkey({
			uri: config.uri,
		});

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

async function createValkeySentinelInstance(config: H5PCacheConfig): Promise<KeyvValkey> {
	try {
		const { sentinelName, sentinelPassword, sentinelServiceName } = config;
		const sentinels = await discoverSentinelHosts(sentinelServiceName);

		const sentinelsConfig = {
			sentinels,
			sentinelPassword,
			password: sentinelPassword,
			name: sentinelName,
		};

		const valkeyInstance = new KeyvValkey(sentinelsConfig);

		return valkeyInstance;
	} catch (err) {
		throw new Error('Can not create valkey "sentinal" instance.', { cause: err });
	}
}

async function discoverSentinelHosts(sentinalServiceName: string): Promise<SentinalHost[]> {
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
