import { KeyvMongo } from '@keyv/mongo';
import { Cache, createCache } from 'cache-manager';
import Keyv from 'keyv';
import { H5P_CACHE_CONFIG_TOKEN, H5PCacheConfig } from '../h5p-cache.config';

export const H5P_CACHE_PROVIDER_TOKEN = 'H5P_CACHE_PROVIDER_TOKEN';

export const H5PCacheProvider = {
	provide: H5P_CACHE_PROVIDER_TOKEN,
	inject: [H5P_CACHE_CONFIG_TOKEN],
	useFactory(configuration: H5PCacheConfig): Cache {
		const keyv = new Keyv<KeyvMongo>(
			new KeyvMongo(configuration.DB_URL, {
				collection: configuration.DB_COLLECTION_NAME,
				username: configuration.DB_USERNAME,
				password: configuration.DB_PASSWORD,
			})
		);
		const cacheAdapter = createCache({
			stores: [keyv],
		});

		return cacheAdapter;
	},
};
