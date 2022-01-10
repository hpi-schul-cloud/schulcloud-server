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

	static mapImportUserScopeToDomain(query: ImportUserFilterQuery): IImportUserScope {
		const dto: IImportUserScope = {};
		dto.firstName = query.firstName;
		dto.lastName = query.lastName;
		if (query.match) {
			if (!Array.isArray(query.match)) query.match = [query.match];
			dto.matches = query.match.map((match) => ImportUserMatchMapper.mapImportUserMatchScopeToDomain(match));
		}
		return dto;
	}
}
