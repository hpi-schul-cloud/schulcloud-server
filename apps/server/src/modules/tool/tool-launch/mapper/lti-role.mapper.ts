import { RoleName } from '@shared/domain';
import { LtiRole } from '../../common/enum';

const RoleMapping: Partial<Record<RoleName, LtiRole>> = {
	[RoleName.USER]: LtiRole.LEARNER,
	[RoleName.STUDENT]: LtiRole.LEARNER,
	[RoleName.TEACHER]: LtiRole.INSTRUCTOR,
	[RoleName.ADMINISTRATOR]: LtiRole.ADMINISTRATOR,
	[RoleName.SUPERHERO]: LtiRole.ADMINISTRATOR,
};

export class LtiRoleMapper {
	public static mapRolesToLtiRoles(roleNames: RoleName[]): LtiRole[] {
		const ltiRoles: (LtiRole | undefined)[] = roleNames.map((roleName: RoleName) => RoleMapping[roleName]);

		const filterUndefined: LtiRole[] = ltiRoles.filter(
			(ltiRole: LtiRole | undefined): ltiRole is LtiRole => ltiRole !== undefined
		);

		return filterUndefined;
	}
}
