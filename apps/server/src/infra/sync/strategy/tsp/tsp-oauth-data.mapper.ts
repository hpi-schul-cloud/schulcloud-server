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
import { RoleName } from '@modules/role';
import { School } from '@modules/school';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';

type ClassNameGradeInfo = { name: string; gradeLevel?: number };

const CLASS_NAME_FORMATS = [
	{
		regex: /^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/,
		values: (fullName: string): ClassNameGradeInfo => {
			let gradeLevel: number | undefined = undefined;
			const gradeMatch = fullName.match(/^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/);
			if (gradeMatch && gradeMatch.length >= 2) {
				gradeLevel = parseInt(gradeMatch[1]);
			}

			let name = fullName;
			const nameMatch = fullName.match(/^(?:0)*(?:(?:1[0-3])|[1-9])(\D.*)$/);
			if (nameMatch && nameMatch.length >= 2) {
				name = nameMatch[1];
			}

			return {
				name,
				gradeLevel,
			};
		},
	},
];

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
		const { externalClasses, classesOfTeachers, classesOfStudents } = this.createMapsOfClasses(tspClasses, tspStudents);
		const oauthDataDtos: OauthDataDto[] = [];
		const usersOfClasses = new Map<string, TspUserInfo[]>();

		this.mapTspTeachersToOauthDataDtos(
			tspTeachers,
			systemDto,
			externalSchools,
			externalClasses,
			classesOfTeachers,
			usersOfClasses
		).forEach((oauthDataDto) => oauthDataDtos.push(oauthDataDto));

		this.mapTspStudentsToOauthDataDtos(
			tspStudents,
			systemDto,
			externalSchools,
			externalClasses,
			classesOfStudents,
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

	private createMapsOfClasses(
		tspClasses: RobjExportKlasse[],
		tspStudents: RobjExportSchueler[]
	): {
		externalClasses: Map<string, ExternalClassDto>;
		classesOfTeachers: Map<string, Array<string>>;
		classesOfStudents: Map<string, Array<string>>;
	} {
		const externalClasses = new Map<string, ExternalClassDto>();
		const classesOfTeachers = new Map<string, Array<string>>();
		const classesOfStudents = new Map<string, Array<string>>();

		tspClasses
			.filter((tspClass) => this.ensureExternalId(tspClass.klasseId, 'class'))
			.forEach((tspClass) => {
				TypeGuard.requireKeys(tspClass, ['klasseId']);

				let className = tspClass.klasseName;
				let classGradeLevel: number | undefined = undefined;
				if (className) {
					const nameGradeInfo = this.getClassNameGradeInfo(className);
					className = nameGradeInfo.name;
					classGradeLevel = nameGradeInfo.gradeLevel;
				}

				const externalClass = new ExternalClassDto({
					externalId: tspClass.klasseId,
					name: className,
					gradeLevel: classGradeLevel,
				});

				externalClasses.set(tspClass.klasseId, externalClass);

				if (tspClass.lehrerUid) {
					const classSet = classesOfTeachers.get(tspClass.lehrerUid) ?? [];
					classSet.push(tspClass.klasseId);
					classesOfTeachers.set(tspClass.lehrerUid, classSet);
				}
			});

		tspStudents
			.filter((tspStudent) => this.ensureExternalId(tspStudent.schuelerUid, 'student'))
			.forEach((tspStudent) => {
				TypeGuard.requireKeys(tspStudent, ['schuelerUid']);

				let classes = classesOfStudents.get(tspStudent.schuelerUid);
				if (!classes) {
					classes = [];
					classesOfStudents.set(tspStudent.schuelerUid, classes);
				}

				if (tspStudent.klasseId) {
					classes.push(tspStudent.klasseId);
				}
			});

		return { externalClasses, classesOfTeachers, classesOfStudents };
	}

	private mapTspTeachersToOauthDataDtos(
		tspTeachers: RobjExportLehrer[],
		systemDto: ProvisioningSystemDto,
		externalSchools: Map<string, ExternalSchoolDto>,
		externalClasses: Map<string, ExternalClassDto>,
		classesOfTeachers: Map<string, Array<string>>,
		usersOfClasses: Map<string, TspUserInfo[]>
	): OauthDataDto[] {
		const oauthDataDtos = tspTeachers
			.filter((tspTeacher) => this.ensureExternalId(tspTeacher.lehrerUid, 'teacher'))
			.map((tspTeacher) => {
				TypeGuard.requireKeys(tspTeacher, ['lehrerUid']);

				const roles: RoleName[] = [];
				if (tspTeacher.lehrerRollen?.includes('Lehrer')) roles.push(RoleName.TEACHER);
				if (tspTeacher.lehrerRollen?.includes('Admin')) roles.push(RoleName.ADMINISTRATOR);

				const externalUser = new ExternalUserDto({
					externalId: tspTeacher.lehrerUid,
					firstName: tspTeacher.lehrerVorname,
					lastName: tspTeacher.lehrerNachname,
					roles,
				});

				const classIds = classesOfTeachers.get(tspTeacher.lehrerUid) ?? [];
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
		classesOfStudents: Map<string, Array<string>>,
		usersOfClasses: Map<string, TspUserInfo[]>
	): OauthDataDto[] {
		const alreadyMapped = new Set<string>();

		const oauthDataDtos = tspStudents
			.filter((tspStudent) => this.ensureExternalId(tspStudent.schuelerUid, 'student'))
			.map((tspStudent) => {
				TypeGuard.requireKeys(tspStudent, ['schuelerUid']);

				if (alreadyMapped.has(tspStudent.schuelerUid)) {
					return undefined;
				}
				alreadyMapped.add(tspStudent.schuelerUid);

				const externalUser = new ExternalUserDto({
					externalId: tspStudent.schuelerUid,
					firstName: tspStudent.schuelerVorname,
					lastName: tspStudent.schuelerNachname,
					roles: [RoleName.STUDENT],
				});

				const externalClassesOfStudent: ExternalClassDto[] = [];
				const externalClassIds = classesOfStudents.get(tspStudent.schuelerUid) ?? [];
				externalClassIds.forEach((externalClassId) => {
					this.addUserInfoToMap(usersOfClasses, externalClassId, tspStudent.schuelerUid, RoleName.STUDENT);
					const externalClass = externalClasses.get(externalClassId);
					if (externalClass) {
						externalClassesOfStudent.push(externalClass);
					}
				});

				const externalSchool =
					tspStudent.schuleNummer == null ? undefined : externalSchools.get(tspStudent.schuleNummer);

				const oauthDataDto = new OauthDataDto({
					system: systemDto,
					externalUser,
					externalSchool,
					externalClasses: externalClassesOfStudent,
				});

				return oauthDataDto;
			})
			.filter((oauthDataDto) => !!oauthDataDto);

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

	private getClassNameGradeInfo(fullClassName: string): ClassNameGradeInfo {
		const classNameFormat = CLASS_NAME_FORMATS.find((format) => format.regex.test(fullClassName));
		if (classNameFormat) {
			return classNameFormat.values(fullClassName);
		}

		return {
			name: fullClassName,
		};
	}
}
