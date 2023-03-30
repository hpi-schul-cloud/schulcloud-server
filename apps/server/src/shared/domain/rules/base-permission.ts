import { User } from '@shared/domain/entity';
import { AuthorisationUtils } from '@shared/domain/rules/authorisation.utils';
import { IPermission, AuthorizationContext, AuthorizableObject } from '../interface';

export abstract class BasePermission<T = AuthorizableObject> implements IPermission<T> {
	public utils = new AuthorisationUtils();

	public abstract isApplicable(user: User, entity: T, context?: AuthorizationContext): boolean;

	public abstract hasPermission(user: User, entity: T, context: AuthorizationContext): boolean;
}
