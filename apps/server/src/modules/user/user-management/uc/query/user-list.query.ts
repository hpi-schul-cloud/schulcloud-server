import { EntityId } from '@shared/domain/types';
import { IsBoolean, IsDate, IsEnum, IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export enum SortableFields {
	firstName = 'firstName',
	lastName = 'lastName',
	birthday = 'birthday',
	email = 'email',
	class = 'class',
	registration = 'registration',
	createdAt = 'createdAt',
}

export class UserListQuery {
	@IsMongoId()
	public schoolId!: EntityId;

	@IsMongoId()
	public roleId!: EntityId;

	@IsInt()
	@Min(5)
	@Max(100)
	public limit!: number;

	@IsInt()
	@Min(0)
	public offset!: number;

	@IsOptional()
	@IsEnum(SortableFields)
	public sortBy?: SortableFields;

	@IsOptional()
	@IsIn([0, 1])
	public sortOrder?: number;

	@IsOptional()
	@IsMongoId({ each: true })
	public classIds?: EntityId[];

	@IsOptional()
	@IsBoolean()
	public isRegistrationComplete?: boolean;

	@IsOptional()
	@IsBoolean()
	public isStudentAgreementMissing?: boolean;

	@IsOptional()
	@IsBoolean()
	public isUserCreated?: boolean;

	@IsOptional()
	@IsDate()
	public createdAfter?: Date;

	@IsOptional()
	@IsDate()
	public createdBefore?: Date;

	@IsOptional()
	@IsDate()
	public lastMigratedAfter?: Date;

	@IsOptional()
	@IsDate()
	public lastMigratedBefore?: Date;

	@IsOptional()
	@IsDate()
	public outdatedSinceAfter?: Date;

	@IsOptional()
	@IsDate()
	public outdatedSinceBefore?: Date;
}
