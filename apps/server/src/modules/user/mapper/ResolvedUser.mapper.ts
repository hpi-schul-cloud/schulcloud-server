import { ResolvedUser } from '@shared/domain/entity';
import { User, Role } from '../entity';

export class ResolvedUserMapper {
	static mapToResponse(user: User, permissions: string[] = [], roles: Role[] = []): ResolvedUser {
		const dto = new ResolvedUser({
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			schoolId: user.school.toString(),
			roles: roles.map((role) => ({ name: role.name, id: role.id })),
			permissions,
		});
		dto.id = user.id;
		dto.createdAt = user.createdAt;
		dto.updatedAt = user.updatedAt;

		return dto;
	}
}
