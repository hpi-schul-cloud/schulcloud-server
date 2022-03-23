import { StringValidator } from '@shared/common';
import { INameMatch, MatchCreator, User } from '@shared/domain';
import { RoleNameResponse, UserMatchResponse } from '../controller/dto';
import { UserFilterParams } from '../controller/dto/user-filter-params';
import { ImportUserMatchMapper } from './match.mapper';

export class UserMatchMapper {
	static mapToDomain(query: UserFilterParams): INameMatch {
		const scope: INameMatch = {};
		if (query.name) {
			if (StringValidator.isNotEmptyString(query.name, true)) {
				scope.name = query.name;
			} else {
				throw Error('invalid name from query');
			}
		}
		return scope;
	}

	static mapToResponse(user: User, matchCreator?: MatchCreator): UserMatchResponse {
		const domainRoles = user.roles.getItems(true);
		const domainRoleNames = domainRoles.map((role) => role.name);
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
		const dto = new UserMatchResponse({
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
