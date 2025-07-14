import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

@ValueObject()
export class JwtPayload {
	constructor(props: unknown) {
		const jwtPayloadProps = props as JwtPayload;

		this.accountId = jwtPayloadProps.accountId;
		this.userId = jwtPayloadProps.userId;
		this.schoolId = jwtPayloadProps.schoolId;
		this.roles = jwtPayloadProps.roles;
		this.support = jwtPayloadProps.support;
		this.systemId = jwtPayloadProps.systemId;
		this.supportUserId = jwtPayloadProps.supportUserId;
		this.isExternalUser = jwtPayloadProps.isExternalUser;
		this.aud = jwtPayloadProps.aud;
		this.exp = jwtPayloadProps.exp;
		this.iat = jwtPayloadProps.iat;
		this.iss = jwtPayloadProps.iss;
		this.jti = jwtPayloadProps.jti;
		this.sub = jwtPayloadProps.sub;
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
