import { faker } from '@faker-js/faker';
import { JwtPayload } from '@infra/auth-guard';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

class JwtPayloadImpl implements JwtPayload {
	accountId: string;

	userId: string;

	schoolId: string;

	roles: string[];

	systemId?: string;

	support?: boolean;

	isExternalUser: boolean;

	aud: string;

	exp: number;

	iat: number;

	iss: string;

	jti: string;

	sub: string;

	constructor(data: JwtPayload) {
		this.accountId = data.accountId;
		this.userId = data.userId;
		this.schoolId = data.schoolId;
		this.roles = data.roles;
		this.systemId = data.systemId || '';
		this.support = data.support || false;
		this.isExternalUser = data.isExternalUser;
		this.aud = data.aud;
		this.exp = data.exp;
		this.iat = data.iat;
		this.iss = data.iss;
		this.jti = data.jti;
		this.sub = data.sub;
	}
}

export class JwtPayloadFactory extends BaseFactory<JwtPayloadImpl, JwtPayload> {}

export const jwtPayloadFactory = JwtPayloadFactory.define(JwtPayloadImpl, ({ sequence }) => {
	return {
		accountId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		roles: ['dummyRoleId'],
		systemId: new ObjectId().toHexString(),
		support: true,
		isExternalUser: true,
		sub: `${faker.lorem.word()} ${sequence}`,
		jti: `${faker.lorem.word()} ${sequence}`,
		aud: `${faker.lorem.word()}`,
		iss: `${faker.lorem.word()}`,
		iat: Math.floor(new Date().getTime() / 1000),
		exp: Math.floor(new Date().getTime() / 1000) + 3600,
	};
});
