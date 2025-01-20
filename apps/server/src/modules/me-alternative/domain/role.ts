import { DomainObject } from '@shared/domain/domain-object';
import { Permission, RoleName } from '@shared/domain/interface';

interface RoleProps {
	id: string;
	name: RoleName;
	permissions: Permission[];
	roles: Role[];
}

export class Role extends DomainObject<RoleProps> {
	public resolvePermissions(): Permission[] {
		let permissions: Permission[] = this.props.permissions;

		const innerRoles = this.props.roles;
		innerRoles?.forEach((innerRole) => {
			const innerPermissions = innerRole.resolvePermissions();
			permissions = [...permissions, ...innerPermissions];
		});

		const uniquePermissions = [...new Set(permissions)];

		return uniquePermissions;
	}
}
