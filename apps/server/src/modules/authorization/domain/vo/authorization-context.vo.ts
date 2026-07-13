import { Permission } from '@shared/domain/interface';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsEnum } from 'class-validator';
import { Action } from '../type/action.enum';
import { AuthorizationContext as AuthorizationContextParams } from '../type/authorization-context.interface';

@ValueObject()
export class AuthorizationContext implements AuthorizationContextParams {
	constructor(props: AuthorizationContext) {
		this.action = props.action;
		this.requiredPermissions = props.requiredPermissions;
	}

	@IsEnum(Action)
	public readonly action: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	public readonly requiredPermissions: Permission[];
}
