import { Logger } from '@core/logger';
import {
	lernperiodeFormat,
	SchulconnexCommunicationType,
	SchulconnexErreichbarkeitenResponse,
	SchulconnexGroupRole,
	SchulconnexGroupType,
	SchulconnexGruppenResponse,
	SchulconnexLaufzeitResponse,
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexResponse,
	SchulconnexRole,
	SchulconnexSonstigeGruppenzugehoerigeResponse,
} from '@infra/schulconnex-client';
import { GroupTypes } from '@modules/group';
import { RoleName } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvalidLaufzeitResponseLoggableException, InvalidLernperiodeResponseLoggableException } from '../../domain';
import {
	ExternalGroupDto,
	ExternalGroupUserDto,
	ExternalLicenseDto,
	ExternalSchoolDto,
	ExternalUserDto,
} from '../../dto';
import { GroupRoleUnknownLoggable } from '../../loggable';
import { ProvisioningConfig } from '../../provisioning.config';

type TimePeriode = {
	from: Date;
	until: Date;
};

@Injectable()
export class SchulconnexResponseMapper {
	SCHOOLNUMBER_PREFIX_REGEX = /^NI_/;

	constructor(
		private readonly configService: ConfigService<ProvisioningConfig, true>,
		private readonly logger: Logger
	) {}

	private RoleMapping: Partial<Record<SchulconnexRole | string, RoleName>> = {
		[SchulconnexRole.LEHR]: RoleName.TEACHER,
		[SchulconnexRole.LERN]: RoleName.STUDENT,
		[SchulconnexRole.LEIT]: RoleName.ADMINISTRATOR,
		[SchulconnexRole.ORGADMIN]: RoleName.ADMINISTRATOR,
		[SchulconnexRole.EXTERN]: this.configService.get('FEATURE_SCHULCONNEX_EXTERNAL_PERSONS')
			? RoleName.EXPERT
			: undefined,
	};

	private GroupRoleMapping: Partial<Record<SchulconnexGroupRole | string, RoleName>> = {
		[SchulconnexGroupRole.TEACHER]: RoleName.TEACHER,
		[SchulconnexGroupRole.SUBSTITUTE_TEACHER]: RoleName.GROUPSUBSTITUTIONTEACHER,
		[SchulconnexGroupRole.STUDENT]: RoleName.STUDENT,
	};

	private GroupTypeMapping: Partial<Record<SchulconnexGroupType | string, GroupTypes>> = {
		[SchulconnexGroupType.CLASS]: GroupTypes.CLASS,
		[SchulconnexGroupType.COURSE]: GroupTypes.COURSE,
		[SchulconnexGroupType.OTHER]: GroupTypes.OTHER,
	};

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

		const role: RoleName | undefined = this.mapSchulconnexRoleToRoleName(source);

		const mapped = new ExternalUserDto({
			firstName: source.person.name.vorname,
			preferredName: source.person.name.rufname,
			lastName: source.person.name.familienname,
			roles: role ? [role] : [],
			externalId: source.pid,
			birthday: source.person.geburt?.datum ? new Date(source.person.geburt?.datum) : undefined,
			email,
		});

		return mapped;
	}

	public mapSchulconnexRoleToRoleName(source: SchulconnexResponse): RoleName | undefined {
		return this.RoleMapping[source.personenkontexte[0].rolle];
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

		const usersInGroupsCount: number = groups.reduce(
			(count: number, group: SchulconnexGruppenResponse) => count + (group.sonstige_gruppenzugehoerige?.length ?? 0),
			groups.length
		);
		const limit: number | undefined = this.configService.get('PROVISIONING_SCHULCONNEX_GROUP_USERS_LIMIT');
		const shouldProvisionOtherUsers: boolean = limit === undefined || usersInGroupsCount < limit;

		const mapped: ExternalGroupDto[] = groups
			.map((group: SchulconnexGruppenResponse) => this.mapExternalGroup(source, group, shouldProvisionOtherUsers))
			.filter((group: ExternalGroupDto | null): group is ExternalGroupDto => group !== null);

		return mapped;
	}

	private mapExternalGroup(
		source: SchulconnexResponse,
		group: SchulconnexGruppenResponse,
		shouldProvisionOtherUsers: boolean
	): ExternalGroupDto | null {
		const groupType: GroupTypes | undefined = this.GroupTypeMapping[group.gruppe.typ];

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
		if (this.configService.get('FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED') && shouldProvisionOtherUsers) {
			otherUsers = group.sonstige_gruppenzugehoerige
				? group.sonstige_gruppenzugehoerige
						.map((relation): ExternalGroupUserDto | null => this.mapToExternalGroupUser(relation))
						.filter((otherUser: ExternalGroupUserDto | null): otherUser is ExternalGroupUserDto => otherUser !== null)
				: [];
		}

		const groupDuration: TimePeriode | undefined = SchulconnexResponseMapper.mapGroupDuration(group.gruppe.laufzeit);

		const externalGroup: ExternalGroupDto = new ExternalGroupDto({
			name: group.gruppe.bezeichnung,
			type: groupType,
			externalId: group.gruppe.id,
			user,
			otherUsers,
			from: groupDuration?.from,
			until: groupDuration?.until,
		});

		return externalGroup;
	}

	private mapToExternalGroupUser(relation: SchulconnexSonstigeGruppenzugehoerigeResponse): ExternalGroupUserDto | null {
		if (!relation.rollen?.length) {
			return null;
		}

		const userRole: RoleName | undefined = this.GroupRoleMapping[relation.rollen[0]];

		if (!userRole) {
			this.logger.warning(new GroupRoleUnknownLoggable(relation));
			return null;
		}

		const mapped = new ExternalGroupUserDto({
			roleName: userRole,
			externalUserId: relation.ktid,
		});

		return mapped;
	}

	private static mapGroupDuration(duration: SchulconnexLaufzeitResponse | undefined): TimePeriode | undefined {
		if (!duration) {
			return undefined;
		}

		let from: Date;
		let until: Date;
		if (duration.von) {
			from = new Date(duration.von);
		} else if (duration.vonlernperiode) {
			const fromPeriode: TimePeriode = SchulconnexResponseMapper.mapLernperiode(duration.vonlernperiode);

			from = fromPeriode.from;
		} else {
			throw new InvalidLaufzeitResponseLoggableException(duration);
		}

		if (duration.bis) {
			until = new Date(duration.bis);
		} else if (duration.bislernperiode) {
			const untilPeriode: TimePeriode = SchulconnexResponseMapper.mapLernperiode(duration.bislernperiode);

			until = untilPeriode.until;
		} else {
			throw new InvalidLaufzeitResponseLoggableException(duration);
		}

		return {
			from,
			until,
		};
	}

	public static mapLernperiode(lernperiode: string): TimePeriode {
		const matches: RegExpMatchArray | null = lernperiode.match(lernperiodeFormat);

		if (!matches || matches.length < 2) {
			throw new InvalidLernperiodeResponseLoggableException(lernperiode);
		}

		const year = Number(matches[1]);
		const semester: number = matches.length >= 3 ? Number(matches[2]) : 0;

		const startMonth: string = semester === 2 ? '02' : '08';
		const endMonth: string = semester === 1 ? '01' : '07';

		const startYear: number = semester === 2 ? year + 1 : year;
		const endYear: number = year + 1;

		return {
			from: new Date(`${startYear}-${startMonth}-01`),
			until: new Date(`${endYear}-${endMonth}-31`),
		};
	}

	public static mapToExternalLicenses(licenseInfos: SchulconnexPoliciesInfoLicenseResponse[]): ExternalLicenseDto[] {
		const externalLicenseDtos: ExternalLicenseDto[] = licenseInfos
			.map((license: SchulconnexPoliciesInfoLicenseResponse) => {
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
