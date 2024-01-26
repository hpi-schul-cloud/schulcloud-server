import { SanisResponse } from '@infra/schulconnex-client';
import { SanisResponseMapper } from '@modules/provisioning';
import { ImportUser, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';

export class SchulconnexImportUserMapper {
	public static mapDataToUserImportEntities(
		response: SanisResponse[],
		system: SystemEntity,
		school: SchoolEntity
	): ImportUser[] {
		const importUsers: ImportUser[] = response.map((externalUser: SanisResponse): ImportUser => {
			const role: RoleName = SanisResponseMapper.mapSanisRoleToRoleName(externalUser);

			const importUser: ImportUser = new ImportUser({
				system,
				school,
				ldapDn: `uid=${externalUser.person.name.vorname}.${externalUser.person.name.familienname},`,
				externalId: externalUser.pid,
				firstName: externalUser.person.name.vorname,
				lastName: externalUser.person.name.familienname,
				roleNames: ImportUser.isImportUserRole(role) ? [role] : [],
				email: '',
			});

			return importUser;
		});

		return importUsers;
	}
}
