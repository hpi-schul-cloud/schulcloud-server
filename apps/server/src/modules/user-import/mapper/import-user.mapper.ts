import { BadRequestException } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { ImportUser, IImportUserScope, SortOrderMap } from '@shared/domain';
import {
	ImportUserResponse,
	ImportUserFilterParams,
	ImportUserSortByParams,
	ImportUserSortingParams,
} from '../controller/dto';

import { ImportUserMatchMapper } from './match.mapper';

import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

export class ImportUserMapper {
	static mapSortingParamsToDomain(sortingQuery: ImportUserSortingParams): SortOrderMap<ImportUser> | undefined {
		const { sortBy } = sortingQuery;
		if (sortBy == null) return undefined;
		const result: SortOrderMap<ImportUser> = {};
		switch (sortBy) {
			case ImportUserSortByParams.FIRSTNAME:
			case ImportUserSortByParams.LASTNAME:
				result[sortBy] = sortingQuery.sortOrder;
				break;
			default:
				throw new BadRequestException();
		}
		return result;
	}

	static mapToResponse(importUser: ImportUser): ImportUserResponse {
		const dto = new ImportUserResponse({
			importUserId: importUser.id,
			loginName: importUser.loginName || '',
			firstName: importUser.firstName,
			lastName: importUser.lastName,
			roleNames: importUser.roleNames.map((role) => RoleNameMapper.mapToResponse(role)),
			classNames: importUser.classNames,
			flagged: importUser.flagged,
		});
		if (importUser.user != null && importUser.matchedBy) {
			const { user } = importUser;
			dto.match = UserMatchMapper.mapToResponse(user, importUser.matchedBy);
		}
		return dto;
	}

	static mapImportUserFilterParamsToDomain(query: ImportUserFilterParams): IImportUserScope {
		const dto: IImportUserScope = {};
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
