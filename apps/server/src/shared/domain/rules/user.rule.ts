import { Injectable } from '@nestjs/common';
import { RoleName, User } from '../entity';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';

@Injectable()
export class UserRule extends BaseRule {
	hasPermission(currentUser: User, targetUser: User, action: Actions): boolean {
		if (this.hasRole(currentUser, RoleName.SUPERHERO)) {
			return true;
		}

		if (!this.isSameSchool(currentUser, targetUser)) {
			return false;
		}

		const permissionsToCheck: string[] = [];
		if (this.hasRole(targetUser, RoleName.STUDENT)) {
			switch (action) {
				case Actions.read:
					permissionsToCheck.push('STUDENT_LIST');
					break;
				case Actions.write:
					permissionsToCheck.push('STUDENT_EDIT');
					break;
				default:
					return false;
			}
		}

		if (this.hasRole(targetUser, RoleName.TEACHER)) {
			switch (action) {
				case Actions.read:
					permissionsToCheck.push('TEACHER_LIST');
					break;
				case Actions.write:
					permissionsToCheck.push('TEACHER_EDIT');
					break;
				default:
					return false;
			}
		}

		// TODO It still needs to be clarified who is allowed to edit admins.
		// Especially the case when an admin is also a teacher.
		if (this.hasRole(targetUser, RoleName.ADMIN)) {
			permissionsToCheck.push('ADMIN_EDIT');
		}

		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return this.hasAllPermissions(currentUser, permissionsToCheck);
	}
}
