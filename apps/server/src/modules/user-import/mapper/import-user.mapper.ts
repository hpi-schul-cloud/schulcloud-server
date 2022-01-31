import { BadRequestException } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { SortingQuery } from '@shared/controller';
import { ImportUser, IImportUserScope, SortOrderMap } from '@shared/domain';
import { ImportUserResponse, ImportUserFilterQuery } from '../controller/dto';
import { ImportUserMatchMapper } from './match.mapper';

import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

export class ImportUserMapper {
	static mapSortingQueryToDomain(sortingQuery: SortingQuery): SortOrderMap<ImportUser> | undefined {
		const { sortBy } = sortingQuery;
		const knownSortByKeys = sortBy as Partial<keyof ImportUser>;
		const sortOrderMap: SortOrderMap<ImportUser> = {};
		if (StringValidator.isNotEmptyString(knownSortByKeys)) {
			switch (knownSortByKeys) {
				case 'firstName':
				case 'lastName':
					sortOrderMap[knownSortByKeys] = sortingQuery.sortOrder;
					return sortOrderMap;
				default:
					throw new BadRequestException();
			}
		}
		return undefined;
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

	static mapImportUserFilterQueryToDomain(query: ImportUserFilterQuery): IImportUserScope {
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
