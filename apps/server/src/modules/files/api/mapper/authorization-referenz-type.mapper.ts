import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { FileOwnerModel } from '../../domain';

export class AuthorizationReferenceTypeMapper {
	public static mapOwnerTypeToReferenceType(ownerType: FileOwnerModel): AuthorizationBodyParamsReferenceType {
		switch (ownerType) {
			case FileOwnerModel.USER:
				return AuthorizationBodyParamsReferenceType.USERS;
			case FileOwnerModel.COURSE:
				return AuthorizationBodyParamsReferenceType.COURSES;
			case FileOwnerModel.TEAMS:
				return AuthorizationBodyParamsReferenceType.TEAMS;
			default:
				throw new Error('Unknown OwnerType');
		}
	}
}
