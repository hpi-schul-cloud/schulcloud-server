import { School } from '@src/modules/school';
import { Role, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { MeAccountResponse, MeResponse, MeRolesReponse, MeSchoolResponse, MeUserResponse } from '../dto';

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
		// i missed the school logoName and url ..is used in frontend but unkown on which place but should expose over me
		// please check vue header components with ticket BC-6371
		const schoolResponse = {
			id: schoolInfoProps.id,
			name: schoolInfoProps.name,
			logo: {
				url: schoolInfoProps.logo_dataUrl || null,
				name: schoolInfoProps.logo_name || null,
			},
		};

		return schoolResponse;
	}

	// comments inside the method are for connect it with vue, remove it with ticket BC-6371
	private static mapUser(user: User, school: School): MeUserResponse {
		const userInfo = user.getInfo();
		const schoolInfoProps = school.getInfo();
		// v1 - user go out with all infos, for example
		// - fullName | displayName -> why? -> frontend!
		// - consent
		// - birthday
		// - preferences
		// - externallyManaged -> store.userIsExternallyManaged ..not in use and solving externallyManaged is total wrong placed in me
		// - avatarInitials -> First char of firstName and lastName -> frontend!
		// - avatarBackgoundColor --> need to be checked, but look like frontend we should expose customAvatarBackgroundColor
		// - age

		const userResponse = {
			id: userInfo.id,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			language: userInfo.language || schoolInfoProps.language || null,
			customAvatarBackgroundColor: userInfo.customAvatarBackgroundColor || null,
		};

		/* take from featherJS, must be moved to vue
		const setAvatarData = (user) => {
			if (user.firstName && user.lastName) {
				user.avatarInitials = user.firstName.charAt(0) + user.lastName.charAt(0);
			} else {
				user.avatarInitials = '?';
			}
			// css readable value like "#ff0000" needed
			const colors = ['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'];
			if (user.customAvatarBackgroundColor) {
				user.avatarBackgroundColor = user.customAvatarBackgroundColor;
			} else {
				// choose colors based on initials
				const index = (user.avatarInitials.charCodeAt(0) + user.avatarInitials.charCodeAt(1)) % colors.length;
				user.avatarBackgroundColor = colors[index];
			}
			return user;
		};
		*/

		return userResponse;
	}

	private static mapUserRoles(user: User): MeRolesReponse[] {
		const roles = user.getRoles();
		const rolesResponse = roles.map((role) => MeResponseMapper.mapRole(role));

		return rolesResponse;
	}

	private static mapRole(role: Role): MeRolesReponse {
		const roleResponse = {
			id: role.id,
			name: role.name,
		};

		return roleResponse;
	}

	private static mapPermissions(user: User): string[] {
		const permissionStrings = user.resolvePermissions();

		return permissionStrings;
	}

	private static mapAccount(accountId: EntityId): MeAccountResponse {
		const accountResponse = {
			id: accountId,
		};

		return accountResponse;
	}
}
