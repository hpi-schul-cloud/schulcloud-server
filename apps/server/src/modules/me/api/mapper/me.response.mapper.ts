import { Role, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School } from '@src/modules/school';
import {
	MeAccountResponse,
	MeResponse,
	MeRolesReponse,
	MeSchoolLogoResponse,
	MeSchoolResponse,
	MeUserResponse,
} from '../dto';

export class MeResponseMapper {
	public static mapToResponse(school: School, user: User, accountId: EntityId): MeResponse {
		const schoolResponse = MeResponseMapper.mapSchool(school);
		const userResponse = MeResponseMapper.mapUser(user);
		const rolesResponse = MeResponseMapper.mapUserRoles(user);
		const permissionsResponse = MeResponseMapper.mapPermissions(user, school);
		const language = user.getInfo().language || school.getInfo().language;
		const accountResponse = MeResponseMapper.mapAccount(accountId);

		const res = new MeResponse({
			school: schoolResponse,
			user: userResponse,
			roles: rolesResponse,
			permissions: permissionsResponse,
			language,
			account: accountResponse,
		});

		return res;
	}

	private static mapSchool(school: School): MeSchoolResponse {
		const schoolInfoProps = school.getInfo();
		const { dataUrl: url, name } = schoolInfoProps.logo || {};

		const logo = new MeSchoolLogoResponse({
			url,
			name,
		});

		const schoolResponse = new MeSchoolResponse({
			id: schoolInfoProps.id,
			name: schoolInfoProps.name,
			logo,
		});

		return schoolResponse;
	}

	private static mapUser(user: User): MeUserResponse {
		const userInfo = user.getInfo();

		const userResponse = new MeUserResponse({
			id: userInfo.id,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			customAvatarBackgroundColor: userInfo.customAvatarBackgroundColor,
		});

		return userResponse;
	}

	private static mapUserRoles(user: User): MeRolesReponse[] {
		const roles = user.getRoles();
		const rolesResponse = roles.map((role) => MeResponseMapper.mapRole(role));

		return rolesResponse;
	}

	private static mapRole(role: Role): MeRolesReponse {
		const roleResponse = new MeRolesReponse({
			id: role.id,
			name: role.name,
		});

		return roleResponse;
	}

	private static mapPermissions(user: User, school: School): string[] {
		const userPermissions = user.resolvePermissions();
		const schoolPermissions = school.getPermissions();

		if (schoolPermissions?.student?.LERNSTORE_VIEW) {
			userPermissions.push(Permission.LERNSTORE_VIEW);
		}

		if (schoolPermissions?.teacher?.STUDENT_LIST) {
			userPermissions.push(Permission.STUDENT_LIST);
		}

		const uniquePermissions = [...new Set(userPermissions)];

		return uniquePermissions;
	}

	private static mapAccount(accountId: EntityId): MeAccountResponse {
		const accountResponse = new MeAccountResponse({
			id: accountId,
		});

		return accountResponse;
	}
}
