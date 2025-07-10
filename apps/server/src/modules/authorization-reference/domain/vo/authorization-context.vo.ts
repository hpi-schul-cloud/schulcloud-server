import { Action, AuthorizationContext } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsEnum } from 'class-validator';

@ValueObject()
export class AuthorizationContextVO implements AuthorizationContext {
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
