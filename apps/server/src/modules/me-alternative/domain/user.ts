import { DomainObject } from '@shared/domain/domain-object';
import { Role } from './role';
import { Permission } from '@shared/domain/interface';

interface UserProps {
	id: string;
	firstName: string;
	roles: Role[];
	schoolName: string;
}

export class User extends DomainObject<UserProps> {
	public resolvePermissions(): Permission[] {
		let permissions: Permission[] = [];

		this.props.roles.forEach((role) => {
			const rolePermissions = role.resolvePermissions();
			permissions = [...permissions, ...rolePermissions];
		});

		// const setOfPermissions = this.resolveSchoolPermissions(permissions, roles);

		const uniquePermissions = [...permissions];

		return uniquePermissions;
	}
}
