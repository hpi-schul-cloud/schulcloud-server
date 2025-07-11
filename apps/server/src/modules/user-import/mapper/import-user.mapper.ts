import { BadRequestException } from '@nestjs/common';
import { StringValidator } from '@shared/common/validator';
import { SortOrderMap } from '@shared/domain/interface';
import {
	FilterImportUserParams,
	ImportUserResponse,
	ImportUserSortOrder,
	SortImportUserParams,
} from '../controller/dto';
import { ImportUserFilter } from '../domain/interface';
import { ImportUser } from '../entity';
import { ImportUserMatchMapper } from './match.mapper';
import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

export class ImportUserMapper {
	public static mapSortingQueryToDomain(sortingQuery: SortImportUserParams): SortOrderMap<ImportUser> | undefined {
		const { sortBy } = sortingQuery;
		if (sortBy == null) return undefined;
		const result: SortOrderMap<ImportUser> = {};
		switch (sortBy) {
			case ImportUserSortOrder.FIRSTNAME:
			case ImportUserSortOrder.LASTNAME:
				result[sortBy] = sortingQuery.sortOrder;
				break;
			default:
				throw new BadRequestException();
		}
		return result;
	}

	public static mapToResponse(importUser: ImportUser): ImportUserResponse {
		const dto = new ImportUserResponse({
			importUserId: importUser.id,
			loginName: importUser.loginName || '',
			firstName: importUser.firstName,
			lastName: importUser.lastName,
			roleNames: importUser.roleNames?.map((role) => RoleNameMapper.mapToResponse(role)),
			classNames: importUser.classNames,
			flagged: importUser.flagged,
			externalRoleNames: importUser.externalRoleNames,
		});
		if (importUser.user != null && importUser.matchedBy) {
			const { user } = importUser;
			dto.match = UserMatchMapper.mapToResponse(user, importUser.matchedBy);
		}
		return dto;
	}

	public static mapImportUserFilterQueryToDomain(query: FilterImportUserParams): ImportUserFilter {
		const dto: ImportUserFilter = {};
		if (StringValidator.isNotEmptyString(query.firstName)) dto.firstName = query.firstName;
		if (StringValidator.isNotEmptyString(query.lastName)) dto.lastName = query.lastName;
		if (StringValidator.isNotEmptyString(query.loginName)) dto.loginName = query.loginName;
		if (query.role != null) {
			dto.role = RoleNameMapper.mapToDomain(query.role);
		}
		if (StringValidator.isNotEmptyString(query.classes)) dto.classes = query.classes;
		if (query.match) {
			dto.matches = query.match.map((match) => ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match));
		}
		if (query.flagged === true) dto.flagged = true;
		return dto;
	}
}
