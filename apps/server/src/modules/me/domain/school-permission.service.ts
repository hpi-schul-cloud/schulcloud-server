import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { School } from '@src/modules/school';

@Injectable()
export class SchoolPermissionService {
	// TODO: refactor it in https://ticketsystem.dbildungscloud.de/browse/BC-7021
	public resolvePermissions(user: User, school: School): Set<string> {
		const userPermissions = user.resolvePermissions();
		const schoolPermissions = school.getPermissions();

		const permissions = new Set(userPermissions);

		if (user.getRoles().some((role) => role.name === RoleName.ADMINISTRATOR)) {
			return permissions;
		}

		if (user.getRoles().some((role) => role.name === RoleName.STUDENT)) {
			if (schoolPermissions?.student?.LERNSTORE_VIEW) {
				permissions.add(Permission.LERNSTORE_VIEW);
			} else {
				permissions.delete(Permission.LERNSTORE_VIEW);
			}
		}

		if (user.getRoles().some((role) => role.name === RoleName.TEACHER)) {
			if (schoolPermissions?.teacher?.STUDENT_LIST) {
				permissions.add(Permission.STUDENT_LIST);
			} else {
				permissions.delete(Permission.STUDENT_LIST);
			}
		}

		return permissions;
	}
}
