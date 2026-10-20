import { plainToInstance } from 'class-transformer';
import { SchulconnexPoliciesInfoLicenseResponse } from './schulconnex-policies-info-license.response';
import { SchulconnexPoliciesInfoPermissionResponse } from './schulconnex-policies-info-permission.response';
import { SchulconnexPoliciesInfoPolicyResponse } from './schulconnex-policies-info-policy.response';

describe('SchulconnexPoliciesInfo response DTOs', () => {
	describe(SchulconnexPoliciesInfoPermissionResponse.name, () => {
		it('should deserialize with action array', () => {
			const raw = {
				action: ['execute'],
				assignee: { refinement: [{ leftOperand: 'a', operator: 'eq', rightOperand: 'b' }] },
			};
			const dto = plainToInstance(SchulconnexPoliciesInfoPermissionResponse, raw);
			expect(dto.action).toEqual(['execute']);
			expect(dto.assignee?.refinement?.[0].leftOperand).toBe('a');
		});

		it('should coerce single action string to array', () => {
			const raw = { action: 'execute' };
			const dto = plainToInstance(SchulconnexPoliciesInfoPermissionResponse, raw);
			expect(dto.action).toEqual(['execute']);
		});

		it('should coerce null action to empty array', () => {
			const raw = { action: null };
			const dto = plainToInstance(SchulconnexPoliciesInfoPermissionResponse, raw);
			expect(dto.action).toEqual([]);
		});
	});

	describe(SchulconnexPoliciesInfoPolicyResponse.name, () => {
		it('should deserialize with all optional fields', () => {
			const raw = {
				uid: 'urn:bilo:license::WEB-507',
				target: { uid: 'urn:bilo:medium:WEB-507', partOf: 'urn:bilo:catalog' },
				assigner: { uid: 'WES', partOf: 'urn:bilo:licensor' },
				permission: [{ action: ['execute'] }],
			};
			const dto = plainToInstance(SchulconnexPoliciesInfoPolicyResponse, raw);
			expect(dto.uid).toBe('urn:bilo:license::WEB-507');
			expect(dto.target?.uid).toBe('urn:bilo:medium:WEB-507');
			expect(dto.assigner?.uid).toBe('WES');
			expect(dto.permission).toHaveLength(1);
		});

		it('should deserialize with no optional fields', () => {
			const dto = plainToInstance(SchulconnexPoliciesInfoPolicyResponse, {});
			expect(dto.uid).toBeUndefined();
			expect(dto.permission).toBeUndefined();
		});
	});

	describe(SchulconnexPoliciesInfoLicenseResponse.name, () => {
		it('should deserialize with policy and access_control', () => {
			const raw = {
				policy: { uid: 'uid', target: { uid: 'medium', partOf: 'catalog' }, permission: [] },
				access_control: { type: 'license_key', value: { licenseKey: 'key' } },
			};
			const dto = plainToInstance(SchulconnexPoliciesInfoLicenseResponse, raw);
			expect(dto.policy?.uid).toBe('uid');
			expect(dto.access_control?.type).toBe('license_key');
		});

		it('should deserialize with legacy target and permission fields', () => {
			const raw = {
				target: { uid: 'medium' },
				permission: [{ action: ['execute'] }],
				access_control: { type: 'license_key', value: { licenseKey: 'key' } },
			};
			const dto = plainToInstance(SchulconnexPoliciesInfoLicenseResponse, raw);
			expect(dto.target?.uid).toBe('medium');
			expect(dto.permission).toHaveLength(1);
		});
	});
});
