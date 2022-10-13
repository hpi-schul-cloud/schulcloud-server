import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { LtiRoleMapper } from '@src/modules/tool/mapper/lti-role.mapper';
import { RoleName } from '@shared/domain';

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

		it('should map schulcloud user to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.STUDENT);

			expect(result).toEqual(LtiRole.LEARNER);
		});

		it('should map schulcloud user to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.TEACHER);

			expect(result).toEqual(LtiRole.INSTRUCTOR);
		});

		it('should map schulcloud user to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.ADMINISTRATOR);

			expect(result).toEqual(LtiRole.ADMINISTRATOR);
		});

		it('should map schulcloud user to lti leaner', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.SUPERHERO);

			expect(result).toEqual(LtiRole.ADMINISTRATOR);
		});

		it('should return undefined for unmapped schulcloud roles', () => {
			const result: LtiRole | undefined = mapper.mapRoleToLtiRole(RoleName.EXPERT);

			expect(result).toBeUndefined();
		});
	});
});
