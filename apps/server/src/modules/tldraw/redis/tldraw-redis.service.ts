import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Buffer } from 'node:buffer';
import { applyAwarenessUpdate } from 'y-protocols/awareness';
import { applyUpdate } from 'yjs';
import { DomainErrorHandler } from '@src/core';
import { WsSharedDocDo } from '../domain';
import { RedisConnectionTypeEnum, UpdateOrigin, UpdateType } from '../types';
import { RedisPublishErrorLoggable, WsSharedDocErrorLoggable } from '../loggable';
import { TldrawRedisFactory } from './tldraw-redis.factory';

@Injectable()
export class TldrawRedisService {
	public readonly sub: Redis;

	private readonly pub: Redis;

	constructor(
		private readonly domainErrorHandler: DomainErrorHandler,
		private readonly tldrawRedisFactory: TldrawRedisFactory
	) {
		this.sub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.SUBSCRIBE);
		this.pub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.PUBLISH);
	}

	public handleMessage = (channelId: string, update: Buffer, doc: WsSharedDocDo): void => {
		if (channelId.includes(UpdateType.AWARENESS)) {
			applyAwarenessUpdate(doc.awareness, update, UpdateOrigin.REDIS);
		} else {
			applyUpdate(doc, update, UpdateOrigin.REDIS);
		}
	};

	public subscribeToRedisChannels(doc: WsSharedDocDo) {
		this.sub.subscribe(doc.name, doc.awarenessChannel).catch((err) => {
			this.domainErrorHandler.exec(
				new WsSharedDocErrorLoggable(doc.name, 'Error while subscribing to Redis channels', err)
			);
		});
	}

	public unsubscribeFromRedisChannels(doc: WsSharedDocDo) {
		this.sub.unsubscribe(doc.name, doc.awarenessChannel).catch((err) => {
			this.domainErrorHandler.exec(
				new WsSharedDocErrorLoggable(doc.name, 'Error while unsubscribing from Redis channels', err)
			);
		});
	}

	public publishUpdateToRedis(doc: WsSharedDocDo, update: Uint8Array, type: UpdateType) {
		const channel = type === UpdateType.AWARENESS ? doc.awarenessChannel : doc.name;
		this.pub.publish(channel, Buffer.from(update)).catch((err) => {
			this.domainErrorHandler.exec(new RedisPublishErrorLoggable(type, err));
		});
	}
}
