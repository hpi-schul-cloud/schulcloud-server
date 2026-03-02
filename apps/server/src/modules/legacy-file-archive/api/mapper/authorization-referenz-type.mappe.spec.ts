import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { OwnerType } from '../../domain';
import { AuthorizationReferenceTypeMapper } from './authorization-referenz-type.mapper';

describe('AuthorizationReferenceTypeMapper', () => {
	describe('mapOwnerTypeToReferenceType', () => {
		describe('when mapping OwnerType.User', () => {
			it('should return AuthorizationBodyParamsReferenceType.USERS', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(OwnerType.User);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.USERS);
			});
		});

		describe('when mapping OwnerType.Course', () => {
			it('should return AuthorizationBodyParamsReferenceType.COURSES', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(OwnerType.Course);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.COURSES);
			});
		});

		describe('when mapping OwnerType.Team', () => {
			it('should return AuthorizationBodyParamsReferenceType.TEAMS', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(OwnerType.Team);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.TEAMS);
			});
		});

		describe('when mapping unknown OwnerType', () => {
			it('should throw an error', () => {
				const unknownOwnerType = 'UNKNOWN' as OwnerType;

				expect(() => AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(unknownOwnerType)).toThrow(
					'Unknown OwnerType'
				);
			});
		});
	});
});
