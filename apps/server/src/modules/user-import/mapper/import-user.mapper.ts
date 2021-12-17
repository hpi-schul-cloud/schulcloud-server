import { ImportUser, IImportUserScope } from '@shared/domain';
import { ImportUserResponse, ImportUserFilterQuery } from '../controller/dto';

import { RoleNameMapper } from './role-name.mapper';

export class ImportUserMapper {
	static mapToResponse(importUser: ImportUser): ImportUserResponse {
		const dto = new ImportUserResponse({
			importUserId: importUser.id,
			loginName: importUser.email, // ToDo: Check
			firstName: importUser.firstName,
			lastName: importUser.lastName,
			roleNames: importUser.roleNames.map((role) => RoleNameMapper.mapToResponse(role)),
			classNames: importUser.classNames,
		});

		return dto;
	}

	static mapNewsScopeToDomain(query: ImportUserFilterQuery): IImportUserScope {
		const dto: IImportUserScope = {};
		dto.firstName = query.firstName;
		dto.lastName = query.lastName;
		return dto;
	}
}
