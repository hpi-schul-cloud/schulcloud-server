import { School } from '@modules/school';
import { System } from '@modules/system';
import { Role, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import {
	MeAccountResponse,
	MeResponse,
	MeRoleResponse,
	MeSchoolLogoResponse,
	MeSchoolResponse,
	MeSystemResponse,
	MeUserResponse,
} from '../dto';

export class MeResponseMapper {
	public static mapToResponse(
		school: School,
		user: User,
		accountId: EntityId,
		permissions: string[],
		system: System | null
	): MeResponse {
		const schoolResponse = MeResponseMapper.mapSchool(school);
		const userResponse = MeResponseMapper.mapUser(user);
		const rolesResponse = MeResponseMapper.mapUserRoles(user);
		const language = user.getInfo().language || school.getInfo().language;
		const accountResponse = MeResponseMapper.mapAccount(accountId);
		const systemResponse = system ? MeResponseMapper.mapSystem(system) : undefined;

		const res = new MeResponse({
			school: schoolResponse,
			user: userResponse,
			roles: rolesResponse,
			permissions,
			language,
			account: accountResponse,
			system: systemResponse,
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

	private static mapUserRoles(user: User): MeRoleResponse[] {
		const roles = user.getRoles();
		const rolesResponse = roles.map((role) => MeResponseMapper.mapRole(role));

		return rolesResponse;
	}

	private static mapRole(role: Role): MeRoleResponse {
		const roleResponse = new MeRoleResponse({
			id: role.id,
			name: role.name,
		});

		return roleResponse;
	}

	private static mapAccount(accountId: EntityId): MeAccountResponse {
		const accountResponse = new MeAccountResponse({
			id: accountId,
		});

		return accountResponse;
	}

	private static mapSystem(system: System): MeSystemResponse {
		const systemResponse = new MeSystemResponse({
			id: system.id,
			name: system.displayName,
			hasEndSessionEndpoint: !!system.oauthConfig?.endSessionEndpoint,
		});

		return systemResponse;
	}
}
