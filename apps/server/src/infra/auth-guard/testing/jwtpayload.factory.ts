import { faker } from '@faker-js/faker';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { JwtPayload } from '../interface';
import { JwtPayloadVo } from '../jwt-payload.vo';

class JwtPayloadFactory extends BaseFactory<JwtPayloadVo, JwtPayload> {
	public asServiceAccount(): this {
		const params: DeepPartial<JwtPayload> = { isServiceAccount: true };

		return this.params(params);
	}
}

export const jwtPayloadFactory = JwtPayloadFactory.define(JwtPayloadVo, ({ sequence }) => {
	return {
		accountId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		roles: ['dummyRoleId'],
		systemId: new ObjectId().toHexString(),
		isServiceAccount: false,
		support: false,
		isExternalUser: true,
		sub: `${faker.lorem.word()} ${sequence}`,
		jti: `${faker.lorem.word()} ${sequence}`,
		aud: `${faker.lorem.word()}`,
		iss: `${faker.lorem.word()}`,
		iat: Math.floor(new Date().getTime() / 1000),
		exp: Math.floor(new Date().getTime() / 1000) + 3600,
	};
});
