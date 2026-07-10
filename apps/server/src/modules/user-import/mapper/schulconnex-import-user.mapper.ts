import {
	SchulconnexGroupType,
	type SchulconnexGruppenResponse,
	type SchulconnexResponse,
} from '@infra/schulconnex-client';
import { type EntityManager } from '@mikro-orm/mongodb';
import { SchulconnexResponseMapper } from '@modules/provisioning';
import { type RoleName } from '@modules/role';
import { type SchoolEntity } from '@modules/school/repo';
import { type System } from '@modules/system';
import { SystemEntity } from '@modules/system/repo';
import { ImportUser } from '../entity';

export class SchulconnexImportUserMapper {
	public static mapDataToUserImportEntities(
		response: SchulconnexResponse[],
		system: System,
		school: SchoolEntity,
		em: EntityManager
	): ImportUser[] {
		const importUsers: ImportUser[] = response.map((externalUser: SchulconnexResponse): ImportUser => {
			const role: RoleName | undefined = SchulconnexResponseMapper.mapSchulconnexRoleToRoleName(externalUser);

			const groups: SchulconnexGruppenResponse[] | undefined = externalUser.personenkontexte[0]?.gruppen?.filter(
				(group) => (group.gruppe.typ as SchulconnexGroupType) === SchulconnexGroupType.CLASS
			);

			const importUser: ImportUser = new ImportUser({
				system: em.getReference(SystemEntity, system.id),
				school,
				ldapDn: `uid=${externalUser.person.name.vorname}.${externalUser.person.name.familienname}.${externalUser.pid},`,
				externalId: externalUser.pid,
				firstName: externalUser.person.name.vorname,
				preferredName: externalUser.person.name.rufname,
				lastName: externalUser.person.name.familienname,
				roleNames: ImportUser.isImportUserRole(role) ? [role] : [],
				email: `${externalUser.person.name.vorname}.${externalUser.person.name.familienname}.${externalUser.pid}@schul-cloud.org`,
				classNames: groups ? SchulconnexResponseMapper.mapToGroupNameList(groups) : [],
				externalRoleNames: [externalUser.personenkontexte[0].rolle],
			});

			return importUser;
		});

		return importUsers;
	}
}
