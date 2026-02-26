import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { OwnerType } from '../domain/interfaces/owner-type.enum';

export class AuthorizationReferenceTypeMapper {
	public static mapOwnerTypeToReferenceType(ownerType: OwnerType): AuthorizationBodyParamsReferenceType {
		switch (ownerType) {
			case OwnerType.User:
				return AuthorizationBodyParamsReferenceType.USERS;
			case OwnerType.Course:
				return AuthorizationBodyParamsReferenceType.COURSES;
			case OwnerType.Team:
				return AuthorizationBodyParamsReferenceType.TEAMS;
			default:
				throw new Error('Unknown OwnerType');
		}
	}
}
