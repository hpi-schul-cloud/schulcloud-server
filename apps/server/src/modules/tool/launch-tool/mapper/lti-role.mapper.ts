import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain';
import { LtiRole } from '../interface';

const RoleMapping: Partial<Record<RoleName, LtiRole>> = {
	[RoleName.USER]: LtiRole.LEARNER,
	[RoleName.STUDENT]: LtiRole.LEARNER,
	[RoleName.TEACHER]: LtiRole.INSTRUCTOR,
	[RoleName.ADMINISTRATOR]: LtiRole.ADMINISTRATOR,
	[RoleName.SUPERHERO]: LtiRole.ADMINISTRATOR,
};

@Injectable()
export class LtiRoleMapper {
	mapRoleToLtiRole(role: RoleName): LtiRole | undefined {
		return RoleMapping[role];
	}
}
