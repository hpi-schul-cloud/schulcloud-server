import { LegacyLogger } from '@core/logger';
import KeyvValkey from '@keyv/valkey';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import Redis from 'iovalkey';
import Keyv from 'keyv';
import * as util from 'util';
import { CacheConfig } from './interface/cache-config.interface';

export class CacheStoreFactory {
	private logger!: LegacyLogger;
	private configService!: ConfigService<CacheConfig>;

	public async build(configService: ConfigService<CacheConfig>, logger: LegacyLogger): Promise<Keyv<KeyvValkey>> {
		this.logger = logger;
		this.logger.setContext(KeyvValkey.name);
		this.configService = configService;

		let redisInstance: KeyvValkey | undefined;

		if (this.configService.get<boolean>('REDIS_CLUSTER_ENABLED')) {
			redisInstance = await this.createValkeySentinelInstance();
		} else if (this.configService.get<string>('REDIS_URI')) {
			redisInstance = this.createNewValkeyInstance();
		} else {
			// If no redis instance is provided, we create a new in-memory store
			redisInstance = undefined;
		}

		const store = new Keyv<KeyvValkey>({ store: redisInstance, useKeyPrefix: false });

		store.on('error', (error) => this.logger.error(error));
		store.on('connect', (msg) => this.logger.log(msg));

		return store;
	}

	private createNewValkeyInstance(): KeyvValkey {
		const redisUrl = this.configService.getOrThrow<string>('REDIS_URI');
		const keyvValkey = new KeyvValkey(redisUrl, { useRedisSets: false });

		return keyvValkey;
	}

	private async createValkeySentinelInstance(): Promise<KeyvValkey> {
		const sentinelName = this.configService.get<string>('REDIS_SENTINEL_NAME');
		const sentinelPassword = this.configService.get<string>('REDIS_SENTINEL_PASSWORD');
		const sentinels = await this.discoverSentinelHosts();
		this.logger.log(`Discovered sentinels: ${JSON.stringify(sentinels)}`);

		const redisInstance = new Redis({
			sentinels,
			sentinelPassword,
			password: sentinelPassword,
			name: sentinelName,
		});
		const keyvValkey = new KeyvValkey(redisInstance, { useRedisSets: false });

		return keyvValkey;
	}

	private async discoverSentinelHosts(): Promise<{ host: string; port: number }[]> {
		return [
			{
				host: 'record.name',
				port: 123,
			},
		];
		const serviceName = this.configService.getOrThrow<string>('REDIS_SENTINEL_SERVICE_NAME');
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
