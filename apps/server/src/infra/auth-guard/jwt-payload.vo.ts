import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsBoolean, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './interface';

@ValueObject()
export class JwtPayloadVo implements JwtPayload {
	@IsMongoId()
	public readonly accountId: string;
	@IsMongoId()
	public readonly userId: string;
	@IsMongoId()
	public readonly schoolId: string;
	@IsMongoId({ each: true })
	public readonly roles: string[];
	@IsBoolean()
	public readonly isServiceAccount: boolean;
	@IsMongoId()
	@IsOptional()
	public readonly systemId?: string;
	@IsBoolean()
	public readonly support: boolean;
	@IsMongoId()
	@IsOptional()
	public readonly supportUserId?: string;
	@IsBoolean()
	public readonly isExternalUser: boolean;

	@IsString()
	public readonly aud: string;
	@IsNumber()
	public readonly exp: number;
	@IsNumber()
	public readonly iat: number;
	@IsString()
	public readonly iss: string;
	@IsString()
	public readonly jti: string;
	@IsString()
	public readonly sub: string;

	constructor(props: JwtPayload) {
		this.accountId = props.accountId;
		this.userId = props.userId;
		this.schoolId = props.schoolId;
		this.roles = props.roles;
		this.isServiceAccount = props.isServiceAccount || false;
		this.systemId = props.systemId;
		this.support = props.support || false;
		this.supportUserId = props.supportUserId;
		this.isExternalUser = props.isExternalUser || false;

		this.aud = props.aud;
		this.exp = props.exp;
		this.iat = props.iat;
		this.iss = props.iss;
		this.jti = props.jti;
		this.sub = props.sub;
	}

	public static fromJwtToken(jwtToken: string): JwtPayloadVo {
		const props = jwt.decode(jwtToken, { json: true }) as JwtPayload | null;

		if (!props) {
			throw new Error('Invalid JWT token');
		}

		return new JwtPayloadVo(props);
	}
}
