import { SanisGroupType, SanisGruppenResponse, SanisResponse } from '@infra/schulconnex-client';
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
			const groups: SanisGruppenResponse[] | undefined = externalUser.personenkontexte[0]?.gruppen?.filter(
				(group) => group.gruppe.typ === SanisGroupType.CLASS
			);

			const importUser: ImportUser = new ImportUser({
				system,
				school,
				ldapDn: `uid=${externalUser.person.name.vorname}.${externalUser.person.name.familienname}.${externalUser.pid},`,
				externalId: externalUser.pid,
				firstName: externalUser.person.name.vorname,
				lastName: externalUser.person.name.familienname,
				roleNames: ImportUser.isImportUserRole(role) ? [role] : [],
				email: `${externalUser.person.name.vorname}.${externalUser.person.name.familienname}.${externalUser.pid}@schul-cloud.org`,
				classNames: groups ? SanisResponseMapper.mapToGroupNameArr(groups) : [],
			});

			return importUser;
		});

		return importUsers;
	}
}
