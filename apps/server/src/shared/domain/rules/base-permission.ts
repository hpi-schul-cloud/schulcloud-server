import { User } from '../entity/user.entity';
import { IPermission, IPermissionContext, PermissionTypes } from '../interface';
import { AuthorisationUtils } from './authorisation.utils';

export abstract class BasePermission<T = PermissionTypes> implements IPermission<T> {
	public utils = new AuthorisationUtils();

	public abstract isApplicable(user: User, entity: T, context?: IPermissionContext): boolean;

	public abstract hasPermission(user: User, entity: T, context: IPermissionContext): boolean;
}
