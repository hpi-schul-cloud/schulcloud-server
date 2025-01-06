import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningSystemDto,
} from '@modules/provisioning';
import { School } from '@modules/school';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { Logger } from '@src/core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '@src/infra/tsp-client';
import { BadDataLoggableException } from '@src/modules/provisioning/loggable';
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

		const externalSchools = new Map<string, ExternalSchoolDto>();
		const externalClasses = new Map<string, ExternalClassDto>();
		const teacherForClasses = new Map<string, Array<string>>();
		const oauthDataDtos: OauthDataDto[] = [];

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

		tspTeachers.forEach((tspTeacher) => {
			if (!tspTeacher.lehrerUid) {
				this.logger.info(new TspMissingExternalIdLoggable('teacher'));
				return;
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

			const externalSchool = tspTeacher.schuleNummer == null ? undefined : externalSchools.get(tspTeacher.schuleNummer);

			const oauthDataDto = new OauthDataDto({
				system: systemDto,
				externalUser,
				externalSchool,
				externalClasses: classes,
			});

			oauthDataDtos.push(oauthDataDto);
		});

		tspStudents.forEach((tspStudent) => {
			if (!tspStudent.schuelerUid) {
				this.logger.info(new TspMissingExternalIdLoggable('student'));
				return;
			}

			const externalUser = new ExternalUserDto({
				externalId: tspStudent.schuelerUid,
				firstName: tspStudent.schuelerVorname,
				lastName: tspStudent.schuelerNachname,
				roles: [RoleName.STUDENT],
			});

			const classStudent = tspStudent.klasseId == null ? undefined : externalClasses.get(tspStudent.klasseId);

			const externalSchool = tspStudent.schuleNummer == null ? undefined : externalSchools.get(tspStudent.schuleNummer);

			const oauthDataDto = new OauthDataDto({
				system: systemDto,
				externalUser,
				externalSchool,
				externalClasses: classStudent ? [classStudent] : [],
			});

			oauthDataDtos.push(oauthDataDto);
		});

		return oauthDataDtos;
	}
}
