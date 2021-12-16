import { ImportUser } from '@shared/domain';
import { ImportUserResponse } from '../controller/dto';

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

		return dto
	}
}
