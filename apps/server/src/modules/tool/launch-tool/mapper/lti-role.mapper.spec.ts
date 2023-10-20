import { RoleName } from '@shared/domain';
import { LtiRole } from '../../interface';
import { LtiRoleMapper } from './lti-role.mapper';

describe('LtiRoleMapper', () => {
	describe('mapRolesToLtiRoles', () => {
		describe('when the provided roles have a mapping', () => {
			it('should map to the corresponding lti role', () => {
				const result: LtiRole[] = LtiRoleMapper.mapRolesToLtiRoles([
					RoleName.USER,
					RoleName.STUDENT,
					RoleName.TEACHER,
					RoleName.ADMINISTRATOR,
					RoleName.SUPERHERO,
				]);

				expect(result).toEqual([
					LtiRole.LEARNER,
					LtiRole.LEARNER,
					LtiRole.INSTRUCTOR,
					LtiRole.ADMINISTRATOR,
					LtiRole.ADMINISTRATOR,
				]);
			});
		});

		describe('when the provided roles have no mapping', () => {
			it('should not return a role mapping for these roles', () => {
				const result: LtiRole[] = LtiRoleMapper.mapRolesToLtiRoles([RoleName.EXPERT, RoleName.HELPDESK]);

				expect(result).toEqual([]);
			});
		});
	});
});
