import { Injectable } from '@nestjs/common';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import { System } from '@modules/system';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { School } from '@modules/school';
import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningSystemDto,
} from '@modules/provisioning';
import { Logger } from '@src/core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '../../../tsp-client';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';

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
	): OauthDataDto[] {
		const systemDto = new ProvisioningSystemDto({
			systemId: system.id,
			provisioningStrategy: SystemProvisioningStrategy.TSP,
		});

		const externalSchools = this.createMapOfExternalSchoolDtos(schools);
		const { externalClasses, teacherForClasses } = this.createMapsOfClasses(tspClasses);
		const oauthDataDtos: OauthDataDto[] = [];

		oauthDataDtos.push(
			...this.mapTspTeachersToOauthDataDtos(tspTeachers, systemDto, externalSchools, externalClasses, teacherForClasses)
		);
		oauthDataDtos.push(...this.mapTspStudentsToOauthDataDtos(tspStudents, systemDto, externalSchools, externalClasses));

		return oauthDataDtos;
	}

	private createMapOfExternalSchoolDtos(schools: School[]): Map<string, ExternalSchoolDto> {
		const externalSchools = new Map<string, ExternalSchoolDto>();

		schools.forEach((school) => {
			if (!school.externalId) {
				throw new BadDataLoggableException(`School ${school.id} has no externalId`);
			}

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

		tspClasses.forEach((tspClass) => {
			if (!tspClass.klasseId) {
				this.logger.info(new TspMissingExternalIdLoggable('class'));
				return;
			}

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
		teacherForClasses: Map<string, Array<string>>
	): OauthDataDto[] {
		const oauthDataDtos = tspTeachers
			.map((tspTeacher) => {
				if (!tspTeacher.lehrerUid) {
					this.logger.info(new TspMissingExternalIdLoggable('teacher'));
					return null;
				}

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

				const externalSchool =
					tspTeacher.schuleNummer == null ? undefined : externalSchools.get(tspTeacher.schuleNummer);

				const oauthDataDto = new OauthDataDto({
					system: systemDto,
					externalUser,
					externalSchool,
					externalClasses: classes,
				});

				return oauthDataDto;
			})
			.filter((oauthDataDto) => oauthDataDto !== null);

		return oauthDataDtos;
	}

	private mapTspStudentsToOauthDataDtos(
		tspStudents: RobjExportSchueler[],
		systemDto: ProvisioningSystemDto,
		externalSchools: Map<string, ExternalSchoolDto>,
		externalClasses: Map<string, ExternalClassDto>
	): OauthDataDto[] {
		const oauthDataDtos = tspStudents
			.map((tspStudent) => {
				if (!tspStudent.schuelerUid) {
					this.logger.info(new TspMissingExternalIdLoggable('student'));
					return null;
				}

				const externalUser = new ExternalUserDto({
					externalId: tspStudent.schuelerUid,
					firstName: tspStudent.schuelerVorname,
					lastName: tspStudent.schuelerNachname,
					roles: [RoleName.STUDENT],
				});

				const classStudent = tspStudent.klasseId == null ? undefined : externalClasses.get(tspStudent.klasseId);

				const externalSchool =
					tspStudent.schuleNummer == null ? undefined : externalSchools.get(tspStudent.schuleNummer);

				const oauthDataDto = new OauthDataDto({
					system: systemDto,
					externalUser,
					externalSchool,
					externalClasses: classStudent ? [classStudent] : [],
				});

				return oauthDataDto;
			})
			.filter((oauthDataDto) => oauthDataDto !== null);

		return oauthDataDtos;
	}
}
