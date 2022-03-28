import { StringValidator } from '@shared/common';
import { INameMatch, MatchCreator, User } from '@shared/domain';
import { UserRole, UserMatchResponse } from '../controller/dto';
import { FilterUserParams } from '../controller/dto/filter-user.params';
import { ImportUserMatchMapper } from './match.mapper';

export class UserMatchMapper {
	static mapToDomain(query: FilterUserParams): INameMatch {
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
		const roleNames: UserRole[] = domainRoleNames
			.map((roleName) => {
				switch (roleName) {
					case 'teacher':
						return UserRole.TEACHER;
					case 'administrator':
						return UserRole.ADMIN;
					case 'student':
						return UserRole.STUDENT;
					default:
						return null;
				}
			})
			.filter((roleName) => roleName != null) as UserRole[];
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
