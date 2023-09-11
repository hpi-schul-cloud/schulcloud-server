import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { GroupTypes } from '@src/modules/group';
import { ExternalGroupDto, ExternalGroupUserDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { GroupRoleUnknownLoggable } from '../../loggable';
import {
	SanisGroupRole,
	SanisGroupType,
	SanisGruppenResponse,
	SanisResponse,
	SanisRole,
	SanisSonstigeGruppenzugehoerigeResponse,
} from './response';

const RoleMapping: Record<SanisRole, RoleName> = {
	[SanisRole.LEHR]: RoleName.TEACHER,
	[SanisRole.LERN]: RoleName.STUDENT,
	[SanisRole.LEIT]: RoleName.ADMINISTRATOR,
	[SanisRole.ORGADMIN]: RoleName.ADMINISTRATOR,
};

const GroupRoleMapping: Partial<Record<SanisGroupRole, RoleName>> = {
	[SanisGroupRole.TEACHER]: RoleName.TEACHER,
	[SanisGroupRole.STUDENT]: RoleName.STUDENT,
};

const GroupTypeMapping: Partial<Record<SanisGroupType, GroupTypes>> = {
	[SanisGroupType.CLASS]: GroupTypes.CLASS,
};

@Injectable()
export class SanisResponseMapper {
	SCHOOLNUMBER_PREFIX_REGEX = /^NI_/;

	constructor(private readonly logger: Logger) {}

	mapToExternalSchoolDto(source: SanisResponse): ExternalSchoolDto {
		const officialSchoolNumber: string = source.personenkontexte[0].organisation.kennung.replace(
			this.SCHOOLNUMBER_PREFIX_REGEX,
			''
		);

		const mapped = new ExternalSchoolDto({
			name: source.personenkontexte[0].organisation.name,
			externalId: source.personenkontexte[0].organisation.id.toString(),
			officialSchoolNumber,
		});

		return mapped;
	}

	mapToExternalUserDto(source: SanisResponse): ExternalUserDto {
		const mapped = new ExternalUserDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			roles: [this.mapSanisRoleToRoleName(source)],
			externalId: source.pid,
		});

		return mapped;
	}

	private mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}

	mapToExternalGroupDtos(source: SanisResponse): ExternalGroupDto[] | undefined {
		const groups: SanisGruppenResponse[] | undefined = source.personenkontexte[0].gruppen;

		if (!groups) {
			return undefined;
		}

		const mapped: ExternalGroupDto[] = groups
			.map((group): ExternalGroupDto | null => {
				const groupType: GroupTypes | undefined = GroupTypeMapping[group.gruppe.typ];

				if (!groupType) {
					return null;
				}

				const sanisGroupUsers = [
					...group.sonstige_gruppenzugehoerige,
					{
						ktid: source.personenkontexte[0].id,
						rollen: group.gruppenzugehoerigkeit.rollen,
					},
				].sort((a, b) => a.ktid.localeCompare(b.ktid));

				const gruppenzugehoerigkeiten: ExternalGroupUserDto[] = sanisGroupUsers
					.map((relation): ExternalGroupUserDto | null => this.mapToExternalGroupUser(relation))
					.filter((user): user is ExternalGroupUserDto => user !== null);

				return {
					name: group.gruppe.bezeichnung,
					type: groupType,
					externalOrganizationId: group.gruppe.orgid,
					from: group.gruppe.laufzeit?.von,
					until: group.gruppe.laufzeit?.bis,
					externalId: group.gruppe.id,
					users: gruppenzugehoerigkeiten,
				};
			})
			.filter((group): group is ExternalGroupDto => group !== null);

		return mapped;
	}

	private mapToExternalGroupUser(relation: SanisSonstigeGruppenzugehoerigeResponse): ExternalGroupUserDto | null {
		const userRole = GroupRoleMapping[relation.rollen[0]];

		if (!userRole) {
			this.logger.info(new GroupRoleUnknownLoggable(relation));
			return null;
		}

		const mapped = new ExternalGroupUserDto({
			roleName: userRole,
			externalUserId: relation.ktid,
		});

		return mapped;
	}
}
