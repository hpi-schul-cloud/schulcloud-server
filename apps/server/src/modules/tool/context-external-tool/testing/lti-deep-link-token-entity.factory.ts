import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { userFactory } from '@testing/factory/user.factory';
import { UUID } from 'bson';
import { LtiDeepLinkTokenEntity, LtiDeepLinkTokenEntityProps } from '../entity';

export const ltiDeepLinkTokenEntityFactory = BaseFactory.define<LtiDeepLinkTokenEntity, LtiDeepLinkTokenEntityProps>(
	LtiDeepLinkTokenEntity,
	() => {
		const expiryTimestampMs = Date.now() + 1000000;

		return {
			id: new ObjectId().toHexString(),
			state: new UUID().toString(),
			user: userFactory.buildWithId(),
			expiresAt: new Date(expiryTimestampMs),
		};
	}
);
