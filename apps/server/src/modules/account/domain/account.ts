import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface AccountProps extends AuthorizableObject {
	id: EntityId;
	updatedAt?: Date;
	createdAt?: Date;
	userId?: EntityId;
	systemId?: EntityId;
	username?: string;
	password?: string;
	token?: string;
	credentialHash?: string;
	lasttriedFailedLogin?: Date;
	expiresAt?: Date;
	activated?: boolean;
	idmReferenceId?: string;
}

export class Account extends DomainObject<AccountProps> {
	get id(): EntityId {
		return this.props.id;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get userId(): EntityId | undefined {
		return this.props.userId;
	}

	get systemId(): EntityId | undefined {
		return this.props.systemId;
	}

	get username(): string | undefined {
		return this.props.username;
	}

	get password(): string | undefined {
		return this.props.password;
	}

	get token(): string | undefined {
		return this.props.token;
	}

	get credentialHash(): string | undefined {
		return this.props.credentialHash;
	}

	get lasttriedFailedLogin(): Date | undefined {
		return this.props.lasttriedFailedLogin;
	}

	get expiresAt(): Date | undefined {
		return this.props.expiresAt;
	}

	get activated(): boolean | undefined {
		return this.props.activated;
	}

	get idmReferenceId(): string | undefined {
		return this.props.idmReferenceId;
	}

	// @IsOptional()
	// @IsDate()
	// createdAt?: Date;

	// @IsOptional()
	// @IsDate()
	// updatedAt?: Date;

	// @IsString()
	// @IsNotEmpty()
	// username?: string;

	// @PrivacyProtect()
	// @IsOptional()
	// @Matches(passwordPattern)
	// password?: string;

	// @IsOptional()
	// @IsString()
	// token?: string;

	// @IsOptional()
	// @IsString()
	// credentialHash?: string;

	// @IsOptional()
	// @IsMongoId()
	// userId?: EntityId;

	// @IsOptional()
	// @IsMongoId()
	// systemId?: EntityId;

	// @IsOptional()
	// @IsDate()
	// lasttriedFailedLogin?: Date;

	// @IsOptional()
	// @IsDate()
	// expiresAt?: Date;

	// @IsOptional()
	// @IsBoolean()
	// activated?: boolean;

	// @IsOptional()
	// idmReferenceId?: string;

	// email: string | undefined;

	// firstName: string | undefined;

	// lastName: string | undefined;

	// attDbcAccountId: string | undefined;

	// attDbcUserId: string | undefined;

	// attDbcSystemId: string | undefined;
}
