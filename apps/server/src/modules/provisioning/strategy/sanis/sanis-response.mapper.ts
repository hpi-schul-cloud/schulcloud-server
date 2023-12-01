import { GroupTypes } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
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
			location: source.personenkontexte[0].organisation.anschrift?.ort,
		});

		return mapped;
	}

	mapToExternalUserDto(source: SanisResponse): ExternalUserDto {
		const mapped = new ExternalUserDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			roles: [this.mapSanisRoleToRoleName(source)],
			externalId: source.pid,
			birthday: source.person.geburt?.datum ? new Date(source.person.geburt?.datum) : undefined,
		});

		return mapped;
	}

	private mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}

	public mapToExternalGroupDtos(source: SanisResponse): ExternalGroupDto[] | undefined {
		const groups: SanisGruppenResponse[] | undefined = source.personenkontexte[0].gruppen;

		if (!groups) {
			return undefined;
		}

		const mapped: ExternalGroupDto[] = groups
			.map((group) => this.mapExternalGroup(source, group))
			.filter((group): group is ExternalGroupDto => group !== null);

		return mapped;
	}

	private mapExternalGroup(source: SanisResponse, group: SanisGruppenResponse): ExternalGroupDto | null {
		const groupType: GroupTypes | undefined = GroupTypeMapping[group.gruppe.typ];

		if (!groupType) {
			return null;
		}

		const user: ExternalGroupUserDto | null = this.mapToExternalGroupUser({
			ktid: source.personenkontexte[0].id,
			rollen: group.gruppenzugehoerigkeit.rollen,
		});

		if (!user) {
			return null;
		}

		let otherUsers: ExternalGroupUserDto[] | undefined;
		if (group.sonstige_gruppenzugehoerige) {
			otherUsers = group.sonstige_gruppenzugehoerige
				.map((relation: SanisSonstigeGruppenzugehoerigeResponse): ExternalGroupUserDto | null =>
					this.mapToExternalGroupUser(relation)
				)
				.filter((otherUser: ExternalGroupUserDto | null): otherUser is ExternalGroupUserDto => otherUser !== null);
		}

		return new ExternalGroupDto({
			name: group.gruppe.bezeichnung,
			type: groupType,
			externalId: group.gruppe.id,
			user,
			otherUsers,
		});
	}

	private mapToExternalGroupUser(relation: SanisSonstigeGruppenzugehoerigeResponse): ExternalGroupUserDto | null {
		if (!relation.rollen?.length) {
			return null;
		}

		const userRole: RoleName | undefined = GroupRoleMapping[relation.rollen[0]];

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
