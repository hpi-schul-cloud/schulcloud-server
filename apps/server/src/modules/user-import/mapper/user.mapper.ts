import { StringValidator } from '@shared/common';
import { INameMatch, User } from '@shared/domain';
import { RoleNameResponse, UserDetailsResponse } from '../controller/dto';
import { UserFilterQuery } from '../controller/dto/user-filter.query';

export class UserMapper {
	static mapToDomain(query: UserFilterQuery): INameMatch {
		const scope: INameMatch = {};
		if (query.name) {
			if (StringValidator.isNotEmptyString(query.name)) {
				scope.fullName = query.name;
			}
			throw Error('invalid name from query');
		}
		return scope;
	}

	static async mapToResponse(user: User): Promise<UserDetailsResponse> {
		const domainRoleNames = await user.getRoleNames();
		const roleNames: RoleNameResponse[] = domainRoleNames
			.map((roleName) => {
				switch (roleName) {
					case 'teacher':
						return RoleNameResponse.TEACHER;
					case 'administrator':
						return RoleNameResponse.ADMIN;
					case 'student':
						return RoleNameResponse.STUDENT;
					default:
						return null;
				}
			})
			.filter((roleName) => roleName != null) as RoleNameResponse[];
		const dto = new UserDetailsResponse({
			userId: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			loginName: user.email,
			roleNames,
		});

		return dto;
	}
}
