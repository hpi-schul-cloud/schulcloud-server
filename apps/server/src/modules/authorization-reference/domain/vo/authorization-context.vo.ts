import { Action, AuthorizationContext as AuthorizationContextParams } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsEnum } from 'class-validator';

@ValueObject()
export class AuthorizationContext implements AuthorizationContextParams {
	constructor(props: unknown) {
		const authorizationContext = props as AuthorizationContext;

		this.action = authorizationContext.action;
		this.requiredPermissions = authorizationContext.requiredPermissions;
	}

	@IsEnum(Action)
	public readonly action: Action;

	@IsArray()
	@IsEnum(Permission, { each: true })
	public readonly requiredPermissions: Permission[];
}
