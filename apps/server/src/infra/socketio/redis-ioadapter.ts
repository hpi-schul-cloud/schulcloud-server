/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Configuration } from '@hpi-schul-cloud/commons';
import { LegacyLogger } from '@src/core/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisIoAdapter extends IoAdapter {
	constructor(private readonly logger: LegacyLogger) {
		super();
	}

	connectToRedis(): ReturnType<typeof createAdapter> | undefined {
		if (Configuration.has('REDIS_URI')) {
			try {
				const redisUri = Configuration.has('REDIS_URI')
					? (Configuration.get('REDIS_URI') as string)
					: 'redis://localhost:6379';
				this.logger.log(`redisUri: ${redisUri}`);
				const pubClient = new Redis(Configuration.get('REDIS_URI') as string);
				const subClient = pubClient.duplicate();

				pubClient.on('error', (err) => {
					this.logger.error('pubClient error', err);
				});
				subClient.on('error', (err) => {
					this.logger.error('subClient error', err);
				});
				const adapterConstructor = createAdapter(pubClient, subClient);
				return adapterConstructor;
			} catch (err) {
				throw new Error('Redis connection failed!');
			}
		}
		return undefined;
	}

	createIOServer(port: number, options?: ServerOptions): IoAdapter {
		const adapterConstructor = this.connectToRedis();
		if (adapterConstructor === undefined) throw new Error('Redis adapter is not connected to Redis yet.');
		const server = super.createIOServer(port, {
			transports: ['websocket'],
			...options,
		});
		if (server === undefined) {
			throw new Error('Unable to create RedisServer');
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		server.adapter(adapterConstructor);
		return server as IoAdapter;
	}
}
