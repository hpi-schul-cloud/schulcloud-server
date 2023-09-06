import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain';
import { GroupTypes } from '@src/modules/group';
import { ExternalSchoolDto, ExternalUserDto, ExternalGroupDto, ExternalGroupUserDto } from '../../dto';
import {
	SanisResponse,
	SanisRole,
	SanisGroupRole,
	SanisGroupType,
	SanisGruppenResponse,
	SanisGruppenzugehoerigkeitResponse,
} from './response';

const RoleMapping: Record<SanisRole, RoleName> = {
	[SanisRole.LEHR]: RoleName.TEACHER,
	[SanisRole.LERN]: RoleName.STUDENT,
	[SanisRole.LEIT]: RoleName.ADMINISTRATOR,
	[SanisRole.ORGADMIN]: RoleName.ADMINISTRATOR,
};

// TODO: ask B.H. if mapping is accepted
const GroupRoleMapping: Record<SanisGroupRole, RoleName> = {
	[SanisGroupRole.TEACHER]: RoleName.TEACHER,
	[SanisGroupRole.STUDENT]: RoleName.STUDENT,
	[SanisGroupRole.CLASS_LEADER]: RoleName.TEACHER,
	[SanisGroupRole.SUPPORT_TEACHER]: RoleName.TEACHER,
	[SanisGroupRole.SCHOOL_SUPPORT]: RoleName.HELPDESK,
	[SanisGroupRole.GROUP_MEMBER]: RoleName.COURSESTUDENT,
	[SanisGroupRole.GROUP_LEADER]: RoleName.COURSETEACHER,
};

const GroupTypeMapping: Partial<Record<SanisGroupType, GroupTypes>> = {
	[SanisGroupType.CLASS]: GroupTypes.CLASS,
};

@Injectable()
export class SanisResponseMapper {
	SCHOOLNUMBER_PREFIX_REGEX = /^NI_/;

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

	mapToExternalGroupDtos(source: SanisResponse): ExternalGroupDto[] {
		const groups: SanisGruppenResponse[] = source.personenkontexte[0].gruppen;

		const mapped: ExternalGroupDto[] = groups
			.map((group): ExternalGroupDto | null => {
				const groupType: GroupTypes | undefined = GroupTypeMapping[group.gruppe.typ];

				if (!groupType) {
					return null;
				}

				return {
					name: group.gruppe.bezeichnung,
					type: groupType,
					externalOrganizationId: group.gruppe.orgid,
					from: group.gruppe.laufzeit.von,
					until: group.gruppe.laufzeit.bis,
					externalId: group.gruppe.id,
					users: group.gruppenzugehoerigkeiten.map(
						(relation): ExternalGroupUserDto => this.mapToExternalGroupUser(relation)
					),
				};
			})
			.filter((group): group is ExternalGroupDto => group !== null);

		return mapped;
	}

	private mapToExternalGroupUser(relation: SanisGruppenzugehoerigkeitResponse): ExternalGroupUserDto {
		const mapped = new ExternalGroupUserDto({
			externalUserId: relation.ktid,
			roleName: GroupRoleMapping[relation.rollen[0]],
		});

		return mapped;
	}
}
