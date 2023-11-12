import * as IoRedis from 'ioredis';
import { WsSharedDocDo } from '@modules/tldraw/domain/ws-shared-doc.do';

export const getDocUpdatesKey = (doc: WsSharedDocDo) => `doc:${doc.name}:updates`;

export const getDocUpdatesFromQueue = async (redis: IoRedis.Redis, doc: WsSharedDocDo) =>
	redis.lrangeBuffer(getDocUpdatesKey(doc), 0, -1);

export const pushDocUpdatesToQueue = async (redis: IoRedis.Redis, doc: WsSharedDocDo, update: Uint8Array) => {
	const len = await redis.llen(getDocUpdatesKey(doc));
	if (len > 100) {
		void redis
			.pipeline()
			.lpopBuffer(getDocUpdatesKey(doc))
			.rpushBuffer(getDocUpdatesKey(doc), Buffer.from(update))
			.expire(getDocUpdatesKey(doc), 300)
			.exec();
	} else {
		await redis
			.pipeline()
			.rpushBuffer(getDocUpdatesKey(doc), Buffer.from(update))
			.expire(getDocUpdatesKey(doc), 300)
			.exec();
	}
};
