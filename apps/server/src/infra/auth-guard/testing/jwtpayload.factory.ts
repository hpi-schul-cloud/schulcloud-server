import { faker } from '@faker-js/faker';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { JwtPayload } from '../interface';

class JwtPayloadImpl implements JwtPayload {
	public accountId: string;

	public userId: string;

	public schoolId: string;

	public roles: string[];

	public systemId?: string;

	public isServiceAccount: boolean;

	public support: boolean;

	public supportUserId?: string;

	public isExternalUser: boolean;

	public aud: string;

	public exp: number;

	public iat: number;

	public iss: string;

	public jti: string;

	public sub: string;

	constructor(data: JwtPayload) {
		this.accountId = data.accountId;
		this.userId = data.userId;
		this.schoolId = data.schoolId;
		this.roles = data.roles;
		this.systemId = data.systemId || '';
		this.isServiceAccount = data.isServiceAccount || false;
		this.support = data.support || false;
		this.isExternalUser = data.isExternalUser;
		this.supportUserId = data.supportUserId;
		this.aud = data.aud;
		this.exp = data.exp;
		this.iat = data.iat;
		this.iss = data.iss;
		this.jti = data.jti;
		this.sub = data.sub;
	}
}

class JwtPayloadFactory extends BaseFactory<JwtPayloadImpl, JwtPayload> {
	public asServiceAccount(): this {
		const params: DeepPartial<JwtPayload> = { isServiceAccount: true };

		return this.params(params);
	}
}

export const jwtPayloadFactory = JwtPayloadFactory.define(JwtPayloadImpl, ({ sequence }) => {
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
