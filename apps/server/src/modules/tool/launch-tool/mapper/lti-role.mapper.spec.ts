import { RoleName } from '@shared/domain';
import { LtiRoleMapper } from './lti-role.mapper';
import { LtiRole } from '../interface';

describe('LtiRoleMapper', () => {
	let mapper: LtiRoleMapper;

	beforeAll(() => {
		mapper = new LtiRoleMapper();
	});

	describe('mapRoleToLtiRole', () => {
		it('should map schulcloud user to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.USER);

			expect(result).toEqual(LtiRole.LEARNER);
		});

		it('should map schulcloud student to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.STUDENT);

			expect(result).toEqual(LtiRole.LEARNER);
		});

		it('should map schulcloud teacher to lti instructor', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.TEACHER);

			expect(result).toEqual(LtiRole.INSTRUCTOR);
		});

		it('should map schulcloud administrator to lti administrator', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.ADMINISTRATOR);

			expect(result).toEqual(LtiRole.ADMINISTRATOR);
		});

		it('should map schulcloud superhero to lti administrator', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.SUPERHERO);

			expect(result).toEqual(LtiRole.ADMINISTRATOR);
		});

		it('should return undefined for unmapped schulcloud role expert', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.EXPERT);

			expect(result).toBeUndefined();
		});
	});
});
