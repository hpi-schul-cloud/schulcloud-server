import { Permission } from '@shared/domain/interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, ValidateNested } from 'class-validator';
import { Action, AuthorizableReferenceType, AuthorizationContext } from '../../domain';

class AuthorizationContextParams implements AuthorizationContext {
	@IsEnum(Action)
	@ApiProperty({
		description: 'Define for which action the operation should be performend.',
		enum: Action,
		example: Action.read,
	})
	action!: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	@ApiProperty({
		enum: Permission,
		isArray: true,
		description: 'User permissions that are needed to execute the operation.',
		example: Permission.USER_UPDATE,
	})
	requiredPermissions!: Permission[];
}

export class AuthorizationBodyParams {
	@ValidateNested({ each: true })
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
