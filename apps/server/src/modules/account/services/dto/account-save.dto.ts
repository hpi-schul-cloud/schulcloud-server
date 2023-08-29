import { PrivacyProtect } from '@shared/controller';
import { EntityId } from '@shared/domain';
import { IsBoolean, IsDate, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { passwordPattern } from '../../controller/dto/password-pattern';

export class AccountSaveDto {
	@IsOptional()
	@IsMongoId()
	readonly id?: EntityId;

	@IsOptional()
	@IsDate()
	readonly createdAt?: Date;

	@IsOptional()
	@IsDate()
	readonly updatedAt?: Date;

	@IsString()
	@IsNotEmpty()
	username: string;

	@PrivacyProtect()
	@IsOptional()
	@Matches(passwordPattern)
	password?: string;

	@IsOptional()
	@IsString()
	token?: string;

	@IsOptional()
	@IsString()
	credentialHash?: string;

	@IsOptional()
	@IsMongoId()
	userId?: EntityId;

	@IsOptional()
	@IsMongoId()
	systemId?: EntityId;

	@IsOptional()
	@IsDate()
	lasttriedFailedLogin?: Date;

	@IsOptional()
	@IsDate()
	expiresAt?: Date;

	@IsOptional()
	@IsBoolean()
	activated?: boolean;

	@IsOptional()
	idmReferenceId?: string;

	constructor(props: AccountSaveDto) {
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.username = props.username;
		this.password = props.password;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
		this.idmReferenceId = props.idmReferenceId;
	}
}
