import type { Role } from '@modules/role/repo';
import { ResolvedUserResponse } from '../../api/dto';
import type { User } from '../../repo';

export class ResolvedUserMapper {
	public static mapToResponse(user: User, permissions: string[] = [], roles: Role[] = []): ResolvedUserResponse {
		const dto = new ResolvedUserResponse();
		dto.id = user.id;
		dto.firstName = user.firstName;
		dto.lastName = user.lastName;
		dto.createdAt = user.createdAt;
		dto.updatedAt = user.updatedAt;
		dto.schoolId = user.school.id;
		dto.roles = roles.map((role) => {
			return { name: role.name, id: role.id };
		});

		dto.permissions = permissions;

		return dto;
	}
}
