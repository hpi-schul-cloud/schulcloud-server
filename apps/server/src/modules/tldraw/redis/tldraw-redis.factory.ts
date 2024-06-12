import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainErrorHandler } from '@src/core';
import { TldrawConfig } from '../config';
import { RedisErrorLoggable } from '../loggable';
import { RedisConnectionTypeEnum } from '../types';

@Injectable()
export class TldrawRedisFactory {
	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly domainErrorHandler: DomainErrorHandler
	) {}

	public build(connectionType: RedisConnectionTypeEnum) {
		const redisUri = this.configService.get<string>('REDIS_URI');
		if (!redisUri) {
			throw new Error('REDIS_URI is not set');
		}

		const redis = new Redis(redisUri, {
			maxRetriesPerRequest: null,
		});

		redis.on('error', (err) => this.domainErrorHandler.exec(new RedisErrorLoggable(connectionType, err)));

		return redis;
	}
}
