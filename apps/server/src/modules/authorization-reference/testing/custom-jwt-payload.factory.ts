import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { CustomJwtPayload } from '../domain';

export const customJwtPayloadFactory = BaseFactory.define<CustomJwtPayload, CustomJwtPayload>(
	CustomJwtPayload,
	({}) => {
		const customJwtPayload = {
			accountId: new ObjectId().toHexString(),
			jti: 'jwt-id-123',
		};

		return customJwtPayload;
	}
);
