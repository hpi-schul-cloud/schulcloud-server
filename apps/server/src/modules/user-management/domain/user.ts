import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { Class } from '@src/modules/class/domain';

export interface UserProps extends AuthorizableObject {
	firstName: string;
	lastName: string;
	email: string;
	classes: Class[];
}

export class User extends DomainObject<UserProps> {
	public addClass(c: Class) {
		this.props.classes.push(c);
	}
}
