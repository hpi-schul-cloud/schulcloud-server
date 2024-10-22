import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@shared/domain/interface';
import { Action, AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, ValidateNested } from 'class-validator';

class AuthorizationContextParams implements AuthorizationContext {
	@IsEnum(Action)
	@ApiProperty({
		name: 'action',
		enum: Action,
		description: 'Define for which action the operation should be performend.',
		example: Action.read,
	})
	action!: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	@ApiProperty({
		name: 'requiredPermissions',
		enum: Permission,
		isArray: true,
		description: 'User permissions that are needed to execute the operation.',
		example: [Permission.USER_UPDATE],
	})
	requiredPermissions!: Permission[];
}

export class AuthorizationBodyParams {
	@ValidateNested()
	@Type(() => AuthorizationContextParams)
	@ApiProperty({
		type: AuthorizationContextParams,
	})
	context!: AuthorizationContextParams;

	@IsEnum(AuthorizableReferenceType)
	@ApiProperty({
		enum: AuthorizableReferenceType,
		description: 'The entity or domain object the operation should be performed on.',
		example: AuthorizableReferenceType.User,
	})
	referenceType!: AuthorizableReferenceType;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the entity/domain object of the defined referenceType.' })
	referenceId!: string;
}
