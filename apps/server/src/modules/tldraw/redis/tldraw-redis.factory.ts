import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { TldrawConfig } from '../config';
import { RedisErrorLoggable } from '../loggable';
import { RedisConnectionTypeEnum } from '../types';

@Injectable()
export class TldrawRedisFactory {
	constructor(private readonly configService: ConfigService<TldrawConfig, true>, private readonly logger: Logger) {
		this.logger.setContext(TldrawRedisFactory.name);
	}

	public build(connectionType: RedisConnectionTypeEnum) {
		const redisUri = this.configService.get<string>('REDIS_URI');
		if (!redisUri) {
			throw new Error('REDIS_URI is not set');
		}

		const redis = new Redis(redisUri, {
			maxRetriesPerRequest: null,
		});

		redis.on('error', (err) => this.logger.warning(new RedisErrorLoggable(connectionType, err)));

		return redis;
	}
}
