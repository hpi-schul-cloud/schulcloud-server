import { User } from '@shared/domain/entity';
import { AuthorisationUtils } from '@shared/domain/rules/authorisation.utils';
import { AuthorizableObjectType, IAuthorizationContext, IRule } from '../interface';

export abstract class BaseRule<T = AuthorizableObjectType> implements IRule<T> {
	public utils = new AuthorisationUtils();

	public abstract isApplicable(user: User, object: T, context?: IAuthorizationContext): boolean;

	public abstract hasPermission(user: User, object: T, context: IAuthorizationContext): boolean;
}
