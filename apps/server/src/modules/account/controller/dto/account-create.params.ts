import { EntityId } from '@shared/domain';
import { IsNotEmpty, IsString, IsMongoId, IsOptional, Matches } from 'class-validator';
import { passwordPattern } from './password-pattern';

export class AccountCreateParams {
	@IsString()
	@IsNotEmpty()
	username!: string;

	@IsOptional()
	@IsMongoId()
	userId?: EntityId;

	@IsOptional()
	@IsMongoId()
	systemId?: EntityId;

	@IsOptional()
	@Matches(passwordPattern)
	password?: string;

	@IsOptional()
	@IsString()
	passwordStrategy?: string;

	activated?: boolean;
}
