import { ImportUser, IImportUserScope } from '@shared/domain';
import { ImportUserResponse, ImportUserFilterQuery } from '../controller/dto';
import { ImportUserMatchMapper } from './match.mapper';

import { RoleNameMapper } from './role-name.mapper';

export class ImportUserMapper {
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
		if (importUser.user && importUser.matchedBy) {
			dto.match = ImportUserMatchMapper.mapToResponse(importUser.user, importUser.matchedBy);
		}
		return dto;
	}

	static mapImportUserFilterQueryToDomain(query: ImportUserFilterQuery): IImportUserScope {
		const dto: IImportUserScope = {};
		if (query.firstName) dto.firstName = query.firstName;
		if (query.lastName) dto.lastName = query.lastName;
		if (query.loginName) dto.loginName = query.loginName;
		if (query.role) {
			dto.role = RoleNameMapper.mapToDomain(query.role);
		}
		if (query.classes) dto.classes = query.classes;
		if (query.match) {
			if (!Array.isArray(query.match)) query.match = [query.match];
			dto.matches = query.match.map((match) => ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match));
		}
		if (query.flagged === true) dto.flagged = true;
		return dto;
	}
}
