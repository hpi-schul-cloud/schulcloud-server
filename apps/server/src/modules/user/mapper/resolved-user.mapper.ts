import { Role, User } from '@shared/domain/entity';
import { ResolvedUserResponse } from '../controller/dto';

export class ResolvedUserMapper {
	static mapToResponse(user: User, permissions: string[] = [], roles: Role[] = []): ResolvedUserResponse {
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
