import { School } from '@src/modules/school';
import { Role, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
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
		const userResponse = MeResponseMapper.mapUser(user, school);
		const rolesResponse = MeResponseMapper.mapUserRoles(user);
		const permissionsResponse = MeResponseMapper.mapPermissions(user);
		const accountResponse = MeResponseMapper.mapAccount(accountId);

		const res = new MeResponse({
			school: schoolResponse,
			user: userResponse,
			roles: rolesResponse,
			permissions: permissionsResponse,
			account: accountResponse,
		});

		return res;
	}

	private static mapSchool(school: School): MeSchoolResponse {
		const schoolInfoProps = school.getInfo();

		const logo = new MeSchoolLogoResponse({
			url: schoolInfoProps.logo_dataUrl,
			name: schoolInfoProps.logo_name,
		});

		const schoolResponse = new MeSchoolResponse({
			id: schoolInfoProps.id,
			name: schoolInfoProps.name,
			logo,
		});

		return schoolResponse;
	}

	private static mapUser(user: User, school: School): MeUserResponse {
		const userInfo = user.getInfo();
		const schoolInfoProps = school.getInfo();

		const userResponse = new MeUserResponse({
			id: userInfo.id,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			language: userInfo.language || schoolInfoProps.language,
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

	private static mapPermissions(user: User): string[] {
		const permissionStrings = user.resolvePermissions();

		return permissionStrings;
	}

	private static mapAccount(accountId: EntityId): MeAccountResponse {
		const accountResponse = new MeAccountResponse({
			id: accountId,
		});

		return accountResponse;
	}
}
