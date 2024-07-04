import { SchulconnexGroupType, SchulconnexGruppenResponse, SchulconnexResponse } from '@infra/schulconnex-client';
import { SchulconnexResponseMapper } from '@modules/provisioning';
import { ImportUser, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';

export class SchulconnexImportUserMapper {
	public static mapDataToUserImportEntities(
		response: SchulconnexResponse[],
		system: SystemEntity,
		school: SchoolEntity
	): ImportUser[] {
		const importUsers: ImportUser[] = response.map((externalUser: SchulconnexResponse): ImportUser => {
			const role: RoleName = SchulconnexResponseMapper.mapSanisRoleToRoleName(externalUser);
			const groups: SchulconnexGruppenResponse[] | undefined = externalUser.personenkontexte[0]?.gruppen?.filter(
				(group) => group.gruppe.typ === SchulconnexGroupType.CLASS
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
				classNames: groups ? SchulconnexResponseMapper.mapToGroupNameList(groups) : [],
			});

			return importUser;
		});

		return importUsers;
	}
}
