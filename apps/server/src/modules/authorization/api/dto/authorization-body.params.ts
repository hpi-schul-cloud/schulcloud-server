import { Permission } from '@shared/domain/interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { Action, AuthorizationContext } from '../../domain';

export class AuthorizationBodyParams implements AuthorizationContext {
	@IsEnum(Action)
	@ApiProperty({ description: 'Define for which action the operation should be performend.' })
	action!: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	@ApiProperty({
		enum: Permission,
		isArray: true,
		description: 'Needed user permissions based on user role, that are needed to execute the operation.',
	})
	requiredPermissions!: Permission[];
}
