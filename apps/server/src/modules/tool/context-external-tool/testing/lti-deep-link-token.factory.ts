import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { UUID } from 'bson';
import { LtiDeepLinkToken, LtiDeepLinkTokenProps } from '../domain';

export const ltiDeepLinkTokenFactory = BaseFactory.define<LtiDeepLinkToken, LtiDeepLinkTokenProps>(
	LtiDeepLinkToken,
	() => {
		const expiryTimestampMs = Date.now() + 1000000;

		return {
			id: new ObjectId().toHexString(),
			state: new UUID().toString(),
			userId: new ObjectId().toHexString(),
			expiresAt: new Date(expiryTimestampMs),
		};
	}
);
