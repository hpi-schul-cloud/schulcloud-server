import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

@ValueObject()
export class JwtPayload {
	constructor(props: JwtPayload) {
		this.accountId = props.accountId;
		this.userId = props.userId;
		this.schoolId = props.schoolId;
		this.roles = props.roles;
		this.support = props.support;
		this.systemId = props.systemId;
		this.supportUserId = props.supportUserId;
		this.isExternalUser = props.isExternalUser;
		this.aud = props.aud;
		this.exp = props.exp;
		this.iat = props.iat;
		this.iss = props.iss;
		this.jti = props.jti;
		this.sub = props.sub;
	}

	@IsMongoId()
	public readonly accountId: string;

	@IsMongoId()
	public readonly userId: string;

	@IsMongoId()
	public readonly schoolId: string;

	@IsArray()
	@IsMongoId({ each: true })
	public readonly roles: string[];

	@IsBoolean()
	public readonly support: boolean;

	@IsOptional()
	@IsString()
	public readonly systemId?: string;

	@IsOptional()
	@IsString()
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
}
