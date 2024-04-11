import {
	SanisGruppenResponse,
	SanisResponse,
	SanisSonstigeGruppenzugehoerigeResponse,
} from '@infra/schulconnex-client';
import { SanisErreichbarkeitenResponse, SchulconnexCommunicationType } from '@infra/schulconnex-client/response';
import { SanisGroupRole } from '@infra/schulconnex-client/response/sanis-group-role';
import { SanisGroupType } from '@infra/schulconnex-client/response/sanis-group-type';
import { SanisRole } from '@infra/schulconnex-client/response/sanis-role';
import { GroupTypes } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { ExternalGroupDto, ExternalGroupUserDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { GroupRoleUnknownLoggable } from '../../loggable';

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
	[SanisGroupType.COURSE]: GroupTypes.COURSE,
	[SanisGroupType.OTHER]: GroupTypes.OTHER,
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
		let email: string | undefined;
		if (source.personenkontexte[0].erreichbarkeiten?.length) {
			const emailContact: SanisErreichbarkeitenResponse | undefined = source.personenkontexte[0].erreichbarkeiten.find(
				(contact: SanisErreichbarkeitenResponse): boolean => contact.typ === SchulconnexCommunicationType.EMAIL
			);
			email = emailContact?.kennung;
		}

		const mapped = new ExternalUserDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			roles: [SanisResponseMapper.mapSanisRoleToRoleName(source)],
			externalId: source.pid,
			birthday: source.person.geburt?.datum ? new Date(source.person.geburt?.datum) : undefined,
			email,
		});

		return mapped;
	}

	public static mapSanisRoleToRoleName(source: SanisResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}

	public static mapToGroupNameArr(source: SanisResponse): string[] {
		const groupNames: string[] = [];

		source.personenkontexte[0]?.gruppen?.forEach((group: SanisGruppenResponse) => {
			if (group.gruppe.typ === SanisGroupType.CLASS) {
				groupNames.push(group.gruppe.bezeichnung);
			}
		});

		return groupNames;
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
