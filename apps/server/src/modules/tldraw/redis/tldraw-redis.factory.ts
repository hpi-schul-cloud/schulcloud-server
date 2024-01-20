import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { TldrawConfig } from '../config';
import { RedisErrorLoggable } from '../loggable';

@Injectable()
export class TldrawRedisFactory {
	private readonly redisUri: string;

	constructor(private readonly configService: ConfigService<TldrawConfig, true>, private readonly logger: Logger) {
		this.logger.setContext(TldrawRedisFactory.name);
		this.redisUri = this.configService.get<string>('REDIS_URI');

		if (!this.redisUri) {
			throw new Error('REDIS_URI is not set');
		}
	}

	public build(connectionType: 'PUB' | 'SUB') {
		const redis = new Redis(this.redisUri, {
			maxRetriesPerRequest: null,
		});

		redis.on('error', (err) => this.logger.warning(new RedisErrorLoggable(connectionType, err)));

		return redis;
	}
}
