import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { JwtPayload } from '../interface/jwt-payload';

class JWTPayload implements JwtPayload {
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

export class JwtPayloadFactory extends BaseFactory<JWTPayload, JwtPayload> {}

export const jwtPayloadFactory = JwtPayloadFactory.define(JWTPayload, ({ sequence }) => {
	return {
		accountId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		roles: ['mockRoleId'],
		systemId: new ObjectId().toHexString(),
		support: true,
		isExternalUser: true,
		sub: `dummyAccountId ${sequence}`,
		jti: `random string ${sequence}`,
		aud: 'some audience',
		iss: 'feathers',
		iat: Math.floor(new Date().getTime() / 1000),
		exp: Math.floor(new Date().getTime() / 1000) + 3600,
	};
});
