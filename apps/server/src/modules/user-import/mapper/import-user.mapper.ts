import { BadRequestException } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { ImportUser } from '@shared/domain/entity';
import { SortOrderMap } from '@shared/domain/interface';
import { IImportUserScope } from '@shared/domain/types';
import {
	FilterImportUserParams,
	ImportUserResponse,
	ImportUserSortOrder,
	SortImportUserParams,
} from '../controller/dto';

import { ImportUserMatchMapper } from './match.mapper';

import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

export class ImportUserMapper {
	static mapSortingQueryToDomain(sortingQuery: SortImportUserParams): SortOrderMap<ImportUser> | undefined {
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

	static mapToResponse(importUser: ImportUser): ImportUserResponse {
		const dto = new ImportUserResponse({
			importUserId: importUser.id,
			loginName: importUser.loginName || '',
			firstName: importUser.firstName,
			lastName: importUser.lastName,
			roleNames: importUser.roleNames?.map((role) => RoleNameMapper.mapToResponse(role)),
			classNames: importUser.classNames,
			flagged: importUser.flagged,
			externalRole: importUser.externalRole,
		});
		if (importUser.user != null && importUser.matchedBy) {
			const { user } = importUser;
			dto.match = UserMatchMapper.mapToResponse(user, importUser.matchedBy);
		}
		return dto;
	}

	static mapImportUserFilterQueryToDomain(query: FilterImportUserParams): IImportUserScope {
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
