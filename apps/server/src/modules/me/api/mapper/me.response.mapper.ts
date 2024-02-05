import { School } from '@src/modules/school';
import { Role, User } from '@shared/domain/entity';
import { MeResponse, MeRolesReponse, MeSchoolResponse, MeUserResponse } from '../dto';

export class MeResponseMapper {
	public static mapToResponse(school: School, user: User, roles: Role[], permissions: string[]): MeResponse {
		const schoolResponse = MeResponseMapper.mapSchool(school);
		const userResponse = MeResponseMapper.mapUser(user);
		const rolesResponse = roles.map((role) => MeResponseMapper.mapRole(role));

		const res = new MeResponse({
			school: schoolResponse,
			user: userResponse,
			roles: rolesResponse,
			permissions,
		});

		return res;
	}

	private static mapSchool(school: School): MeSchoolResponse {
		const schoolProps = school.getProps();
		const schoolResponse = {
			id: schoolProps.id,
		};

		return schoolResponse;
	}

	private static mapUser(user: User): MeUserResponse {
		const userResponse = {
			id: user.id,
		};

		return userResponse;
	}

	private static mapRole(role: Role): MeRolesReponse {
		const roleResponse = {
			id: role.id,
		};

		return roleResponse;
	}
}
