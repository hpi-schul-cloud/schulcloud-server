import { Permission } from '@shared/domain/interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, ValidateNested } from 'class-validator';
import { Action, AuthorizableReferenceType, AuthorizationContext } from '../../domain';

class AuthorizationContextParms implements AuthorizationContext {
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
		description: 'Needed user permissions based on user role, that are needed to execute the operation.',
		example: Permission.USER_UPDATE,
	})
	requiredPermissions!: Permission[];
}

export class AuthorizationBodyParams {
	@ValidateNested({ each: true })
	@ApiProperty({
		type: AuthorizationContextParms,
	})
	context!: AuthorizationContextParms;

	@IsEnum(AuthorizableReferenceType)
	@ApiProperty({
		enum: AuthorizableReferenceType,
		description: 'Define for which known entity, or domain object the operation should be peformend.',
		example: AuthorizableReferenceType.User,
	})
	referenceType!: AuthorizableReferenceType;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the entity/domain object of the defined referenceType.' })
	referenceId!: string;
}
