import { StringValidator } from '@shared/common';
import { INameMatch, MatchCreator, User } from '@shared/domain';
import { RoleNameResponse, UserResponse } from '../controller/dto';
import { UserFilterQuery } from '../controller/dto/user-filter.query';
import { ImportUserMatchMapper } from './match.mapper';

export class UserMapper {
	static mapToDomain(query: UserFilterQuery): INameMatch {
		const scope: INameMatch = {};
		if (query.name) {
			if (StringValidator.isNotEmptyString(query.name, true)) {
				scope.fullName = query.name.trim();
			} else {
				throw Error('invalid name from query');
			}
		}
		return scope;
	}

	static async mapToResponse(user: User, matchCreator?: MatchCreator): Promise<UserResponse> {
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
		const dto = new UserResponse({
			userId: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			loginName: user.email,
			roleNames,
		});
		if (matchCreator != null) {
			const matchedBy = ImportUserMatchMapper.mapMatchCreatorToResponse(matchCreator);
			dto.matchedBy = matchedBy;
		}
		return dto;
	}
}
