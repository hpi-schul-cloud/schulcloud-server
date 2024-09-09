import { StringValidator } from '@shared/common';
import { User } from '@shared/domain/entity';
import { UserMatchResponse, UserRole } from '../controller/dto';
import { FilterUserParams } from '../controller/dto/filter-user.params';
import { ImportUserNameMatchFilter } from '../domain/interface';
import { MatchCreator } from '../entity';
import { ImportUserMatchMapper } from './match.mapper';

export class UserMatchMapper {
	static mapToDomain(query: FilterUserParams): ImportUserNameMatchFilter {
		const scope: ImportUserNameMatchFilter = {};
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
