import { ObjectId } from '@mikro-orm/mongodb';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { UUID } from 'bson';
import { LtiDeepLinkTokenEntity, LtiDeepLinkTokenEntityProps } from '../repo';

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
