import { Action, AuthorizationContext as AuthorizationContextParams } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsEnum } from 'class-validator';

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
