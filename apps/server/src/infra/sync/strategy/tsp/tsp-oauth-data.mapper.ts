import { Logger } from '@core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '@infra/tsp-client';
import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningSystemDto,
} from '@modules/provisioning';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import { School } from '@modules/school';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';

export type TspUserInfo = {
	externalId: string;
	role: RoleName.TEACHER | RoleName.STUDENT;
};

@Injectable()
export class TspOauthDataMapper {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(TspOauthDataMapper.name);
	}

	public mapTspDataToOauthData(
		system: System,
		schools: School[],
		tspTeachers: RobjExportLehrer[],
		tspStudents: RobjExportSchueler[],
		tspClasses: RobjExportKlasse[]
	): { oauthDataDtos: OauthDataDto[]; usersOfClasses: Map<string, TspUserInfo[]> } {
		const systemDto = new ProvisioningSystemDto({
			systemId: system.id,
			provisioningStrategy: SystemProvisioningStrategy.TSP,
		});

		const externalSchools = this.createMapOfExternalSchoolDtos(schools);
		const { externalClasses, teacherForClasses } = this.createMapsOfClasses(tspClasses);
		const oauthDataDtos: OauthDataDto[] = [];
		const usersOfClasses = new Map<string, TspUserInfo[]>();

		this.mapTspTeachersToOauthDataDtos(
			tspTeachers,
			systemDto,
			externalSchools,
			externalClasses,
			teacherForClasses,
			usersOfClasses
		).forEach((oauthDataDto) => oauthDataDtos.push(oauthDataDto));

		this.mapTspStudentsToOauthDataDtos(
			tspStudents,
			systemDto,
			externalSchools,
			externalClasses,
			usersOfClasses
		).forEach((oauthDataDto) => oauthDataDtos.push(oauthDataDto));

		return { oauthDataDtos, usersOfClasses };
	}

	private createMapOfExternalSchoolDtos(schools: School[]): Map<string, ExternalSchoolDto> {
		const externalSchools = new Map<string, ExternalSchoolDto>();

		schools.forEach((school) => {
			TypeGuard.requireKeys(
				school,
				['externalId'],
				new BadDataLoggableException(`School ${school.id} has no externalId`)
			);

			externalSchools.set(
				school.externalId,
				new ExternalSchoolDto({
					externalId: school.externalId,
				})
			);
		});

		return externalSchools;
	}

	private createMapsOfClasses(tspClasses: RobjExportKlasse[]): {
		externalClasses: Map<string, ExternalClassDto>;
		teacherForClasses: Map<string, Array<string>>;
	} {
		const externalClasses = new Map<string, ExternalClassDto>();
		const teacherForClasses = new Map<string, Array<string>>();

		tspClasses
			.filter((tspClass) => this.ensureExternalId(tspClass.klasseId, 'class'))
			.forEach((tspClass) => {
				TypeGuard.requireKeys(tspClass, ['klasseId']);

				const externalClass = new ExternalClassDto({
					externalId: tspClass.klasseId,
					name: tspClass.klasseName,
				});

				externalClasses.set(tspClass.klasseId, externalClass);

				if (tspClass.lehrerUid) {
					const classSet = teacherForClasses.get(tspClass.lehrerUid) ?? [];
					classSet.push(tspClass.klasseId);
					teacherForClasses.set(tspClass.lehrerUid, classSet);
				}
			});

		return { externalClasses, teacherForClasses };
	}

	private mapTspTeachersToOauthDataDtos(
		tspTeachers: RobjExportLehrer[],
		systemDto: ProvisioningSystemDto,
		externalSchools: Map<string, ExternalSchoolDto>,
		externalClasses: Map<string, ExternalClassDto>,
		teacherForClasses: Map<string, Array<string>>,
		usersOfClasses: Map<string, TspUserInfo[]>
	): OauthDataDto[] {
		const oauthDataDtos = tspTeachers
			.filter((tspTeacher) => this.ensureExternalId(tspTeacher.lehrerUid, 'teacher'))
			.map((tspTeacher) => {
				TypeGuard.requireKeys(tspTeacher, ['lehrerUid']);

				const externalUser = new ExternalUserDto({
					externalId: tspTeacher.lehrerUid,
					firstName: tspTeacher.lehrerVorname,
					lastName: tspTeacher.lehrerNachname,
					roles: [RoleName.TEACHER],
				});

				const classIds = teacherForClasses.get(tspTeacher.lehrerUid) ?? [];
				const classes: ExternalClassDto[] = classIds
					.map((classId) => externalClasses.get(classId))
					.filter((externalClass: ExternalClassDto | undefined): externalClass is ExternalClassDto => !!externalClass);

				classIds.forEach((classId) =>
					this.addUserInfoToMap(usersOfClasses, classId, tspTeacher.lehrerUid, RoleName.TEACHER)
				);

				const externalSchool =
					tspTeacher.schuleNummer == null ? undefined : externalSchools.get(tspTeacher.schuleNummer);

				const oauthDataDto = new OauthDataDto({
					system: systemDto,
					externalUser,
					externalSchool,
					externalClasses: classes,
				});

				return oauthDataDto;
			});

		return oauthDataDtos;
	}

	private mapTspStudentsToOauthDataDtos(
		tspStudents: RobjExportSchueler[],
		systemDto: ProvisioningSystemDto,
		externalSchools: Map<string, ExternalSchoolDto>,
		externalClasses: Map<string, ExternalClassDto>,
		usersOfClasses: Map<string, TspUserInfo[]>
	): OauthDataDto[] {
		const oauthDataDtos = tspStudents
			.filter((tspStudent) => this.ensureExternalId(tspStudent.schuelerUid, 'student'))
			.map((tspStudent) => {
				TypeGuard.requireKeys(tspStudent, ['schuelerUid']);

				const externalUser = new ExternalUserDto({
					externalId: tspStudent.schuelerUid,
					firstName: tspStudent.schuelerVorname,
					lastName: tspStudent.schuelerNachname,
					roles: [RoleName.STUDENT],
				});

				let classStudent: ExternalClassDto | undefined;
				if (tspStudent.klasseId) {
					classStudent = externalClasses.get(tspStudent.klasseId);
					this.addUserInfoToMap(usersOfClasses, tspStudent.klasseId, tspStudent.schuelerUid, RoleName.STUDENT);
				}

				const externalSchool =
					tspStudent.schuleNummer == null ? undefined : externalSchools.get(tspStudent.schuleNummer);

				const oauthDataDto = new OauthDataDto({
					system: systemDto,
					externalUser,
					externalSchool,
					externalClasses: classStudent ? [classStudent] : [],
				});

				return oauthDataDto;
			});

		return oauthDataDtos;
	}

	private ensureExternalId(externalId: string | undefined, type: string): boolean {
		if (!externalId) {
			this.logger.info(new TspMissingExternalIdLoggable(type));
			return false;
		}
		return true;
	}

	private addUserInfoToMap(
		usersOfClasses: Map<string, TspUserInfo[]>,
		classId: string,
		externalId: string,
		role: RoleName.TEACHER | RoleName.STUDENT
	): void {
		let userInfos = usersOfClasses.get(classId);
		if (userInfos === undefined) {
			userInfos = [];
			usersOfClasses.set(classId, userInfos);
		}

		userInfos.push({
			externalId,
			role,
		});
	}
}
