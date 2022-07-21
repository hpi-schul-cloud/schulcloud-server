import { User } from '@shared/domain/entity';
import { AuthorisationUtils } from '@shared/domain/rules/authorisation.utils';
import { IPermission, IPermissionContext, PermissionTypes } from '../interface';

export abstract class BasePermission<T = PermissionTypes> implements IPermission<T> {
	public utils = new AuthorisationUtils();

	public abstract isApplicable(user: User, entity: T, context?: IPermissionContext): boolean;

	public abstract hasPermission(user: User, entity: T, context: IPermissionContext): boolean;
}
