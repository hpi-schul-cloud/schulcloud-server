import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { FileOwnerModel } from '../../domain';
import { AuthorizationReferenceTypeMapper } from './authorization-referenz-type.mapper';

describe('AuthorizationReferenceTypeMapper', () => {
	describe('mapOwnerTypeToReferenceType', () => {
		describe('when mapping FileOwnerModel.USER', () => {
			it('should return AuthorizationBodyParamsReferenceType.USERS', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(FileOwnerModel.USER);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.USERS);
			});
		});

		describe('when mapping FileOwnerModel.COURSE', () => {
			it('should return AuthorizationBodyParamsReferenceType.COURSES', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(FileOwnerModel.COURSE);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.COURSES);
			});
		});

		describe('when mapping FileOwnerModel.TEAMS', () => {
			it('should return AuthorizationBodyParamsReferenceType.TEAMS', () => {
				const result = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(FileOwnerModel.TEAMS);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.TEAMS);
			});
		});

		describe('when mapping unknown FileOwnerModel', () => {
			it('should throw an error', () => {
				const unknownOwnerType = 'UNKNOWN' as FileOwnerModel;

				expect(() => AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(unknownOwnerType)).toThrow(
					'Unknown OwnerType'
				);
			});
		});
	});
});
