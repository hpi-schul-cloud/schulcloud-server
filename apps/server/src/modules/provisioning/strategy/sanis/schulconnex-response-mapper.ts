import {
	SchulconnexGruppenResponse,
	SchulconnexResponse,
	SchulconnexSonstigeGruppenzugehoerigeResponse,
} from '@infra/schulconnex-client';
import {
	SchulconnexCommunicationType,
	SchulconnexErreichbarkeitenResponse,
	SchulconnexLizenzInfoResponse,
} from '@infra/schulconnex-client/response';
import { SchulconnexGroupRole } from '@infra/schulconnex-client/response/schulconnex-group-role';
import { SchulconnexGroupType } from '@infra/schulconnex-client/response/schulconnex-group-type';
import { SchulconnexRole } from '@infra/schulconnex-client/response/schulconnex-role';
import { GroupTypes } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import {
	ExternalGroupDto,
	ExternalGroupUserDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
} from '../../dto';
import { GroupRoleUnknownLoggable } from '../../loggable';

const RoleMapping: Record<SchulconnexRole, RoleName> = {
	[SchulconnexRole.LEHR]: RoleName.TEACHER,
	[SchulconnexRole.LERN]: RoleName.STUDENT,
	[SchulconnexRole.LEIT]: RoleName.ADMINISTRATOR,
	[SchulconnexRole.ORGADMIN]: RoleName.ADMINISTRATOR,
};

const GroupRoleMapping: Partial<Record<SchulconnexGroupRole, RoleName>> = {
	[SchulconnexGroupRole.TEACHER]: RoleName.TEACHER,
	[SchulconnexGroupRole.STUDENT]: RoleName.STUDENT,
};

const GroupTypeMapping: Partial<Record<SchulconnexGroupType, GroupTypes>> = {
	[SchulconnexGroupType.CLASS]: GroupTypes.CLASS,
	[SchulconnexGroupType.COURSE]: GroupTypes.COURSE,
	[SchulconnexGroupType.OTHER]: GroupTypes.OTHER,
};

@Injectable()
export class SchulconnexResponseMapper {
	SCHOOLNUMBER_PREFIX_REGEX = /^NI_/;

	constructor(
		@Inject(ProvisioningFeatures) protected readonly provisioningFeatures: IProvisioningFeatures,
		private readonly logger: Logger
	) {}

	public mapToExternalSchoolDto(source: SchulconnexResponse): ExternalSchoolDto {
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

	public mapToExternalUserDto(source: SchulconnexResponse): ExternalUserDto {
		let email: string | undefined;
		if (source.personenkontexte[0].erreichbarkeiten?.length) {
			const emailContact: SchulconnexErreichbarkeitenResponse | undefined =
				source.personenkontexte[0].erreichbarkeiten.find(
					(contact: SchulconnexErreichbarkeitenResponse): boolean => contact.typ === SchulconnexCommunicationType.EMAIL
				);
			email = emailContact?.kennung;
		}

		const mapped = new ExternalUserDto({
			firstName: source.person.name.vorname,
			lastName: source.person.name.familienname,
			roles: [SchulconnexResponseMapper.mapSanisRoleToRoleName(source)],
			externalId: source.pid,
			birthday: source.person.geburt?.datum ? new Date(source.person.geburt?.datum) : undefined,
			email,
		});

		return mapped;
	}

	public static mapSanisRoleToRoleName(source: SchulconnexResponse): RoleName {
		return RoleMapping[source.personenkontexte[0].rolle];
	}

	public static mapToGroupNameList(groups: SchulconnexGruppenResponse[]): string[] {
		const groupNames: string[] = [];

		groups.forEach((group: SchulconnexGruppenResponse) => {
			groupNames.push(group.gruppe.bezeichnung);
		});

		return groupNames;
	}

	public mapToExternalGroupDtos(source: SchulconnexResponse): ExternalGroupDto[] | undefined {
		const groups: SchulconnexGruppenResponse[] | undefined = source.personenkontexte[0].gruppen;

		if (!groups) {
			return undefined;
		}

		const mapped: ExternalGroupDto[] = groups
			.map((group) => this.mapExternalGroup(source, group))
			.filter((group): group is ExternalGroupDto => group !== null);

		return mapped;
	}

	private mapExternalGroup(source: SchulconnexResponse, group: SchulconnexGruppenResponse): ExternalGroupDto | null {
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
		if (this.provisioningFeatures.schulconnexOtherGroupusersEnabled) {
			otherUsers = group.sonstige_gruppenzugehoerige
				? (group.sonstige_gruppenzugehoerige
						.map((relation): ExternalGroupUserDto | null => this.mapToExternalGroupUser(relation))
						.filter((otherUser: ExternalGroupUserDto | null) => otherUser !== null) as ExternalGroupUserDto[])
				: [];
		}

		return new ExternalGroupDto({
			name: group.gruppe.bezeichnung,
			type: groupType,
			externalId: group.gruppe.id,
			user,
			otherUsers,
		});
	}

	private mapToExternalGroupUser(relation: SchulconnexSonstigeGruppenzugehoerigeResponse): ExternalGroupUserDto | null {
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

	public static mapToExternalLicenses(licenseInfos: SchulconnexLizenzInfoResponse[]): ExternalLicenseDto[] {
		const externalLicenseDtos: ExternalLicenseDto[] = licenseInfos
			.map((license: SchulconnexLizenzInfoResponse) => {
				if (license.target.partOf === '') {
					license.target.partOf = undefined;
				}

				const externalLicenseDto: ExternalLicenseDto = new ExternalLicenseDto({
					mediumId: license.target.uid,
					mediaSourceId: license.target.partOf,
				});

				return externalLicenseDto;
			})
			.filter((license: ExternalLicenseDto) => license.mediumId !== '');

		return externalLicenseDtos;
	}
}
