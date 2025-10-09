import KeyvValkey from '@keyv/valkey';
import { Cache, createCache } from 'cache-manager';
import Valkey from 'iovalkey';
import Keyv from 'keyv';

export const H5P_CACHE_PROVIDER_TOKEN = 'H5P_CACHE_PROVIDER_TOKEN';
export const H5P_CACHE_VALKEY_CLIENT = 'H5P_CACHE_VALKEY_CLIENT';

export const H5PCacheProvider = {
	provide: H5P_CACHE_PROVIDER_TOKEN,
	inject: [H5P_CACHE_VALKEY_CLIENT],
	useFactory(valkeyInstance: Valkey): Cache {
		const stores: Keyv<KeyvValkey>[] = [];
		if (valkeyInstance instanceof Valkey) {
			stores.push(new Keyv(new KeyvValkey(valkeyInstance)));
		}

		const cacheAdapter = createCache({
			stores,
		});

		return cacheAdapter;
	},
};
