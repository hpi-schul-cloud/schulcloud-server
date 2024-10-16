import {
	RobjExportKlasse,
	RobjExportLehrer,
	RobjExportSchueler,
	RobjExportSchule,
	TspClientFactory,
} from '@infra/tsp-client';
import { FederalStateService, SchoolYearService } from '@modules/legacy-school';
import { School, SchoolService } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { FederalStateNames } from '@src/modules/legacy-school/types';
import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	ProvisioningSystemDto,
} from '@src/modules/provisioning';
import { BadDataLoggableException } from '@src/modules/provisioning/loggable';
import { FederalState } from '@src/modules/school/domain';
import { SchoolFactory } from '@src/modules/school/domain/factory';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { ObjectId } from 'bson';
import moment from 'moment/moment';
import { TspMissingExternalIdLoggable } from './loggable/tsp-missing-external-id.loggable';
import { TspSystemNotFoundLoggableException } from './loggable/tsp-system-not-found.loggable-exception';

@Injectable()
export class TspSyncService {
	private federalState: FederalState | undefined;

	constructor(
		private readonly tspClientFactory: TspClientFactory,
		private readonly systemService: SystemService,
		private readonly schoolService: SchoolService,
		private readonly federalStateService: FederalStateService,
		private readonly schoolYearService: SchoolYearService,
		private readonly logger: Logger
	) {
		this.logger.setContext(TspSyncService.name);
	}

	public async findTspSystemOrFail(): Promise<System> {
		const systems = (
			await this.systemService.find({
				types: [SystemType.OAUTH, SystemType.OIDC],
			})
		).filter((system) => system.provisioningStrategy === SystemProvisioningStrategy.TSP);

		if (systems.length === 0) {
			throw new TspSystemNotFoundLoggableException();
		}

		return systems[0];
	}

	public async fetchTspSchools(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const schools: RobjExportSchule[] = (await client.exportSchuleList(lastChangeDate)).data;

		return schools;
	}

	public async fetchTspTeachers(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const teachers: RobjExportLehrer[] = (await client.exportLehrerList(lastChangeDate)).data;

		return teachers;
	}

	public async fetchTspStudents(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const students: RobjExportSchueler[] = (await client.exportSchuelerList(lastChangeDate)).data;

		return students;
	}

	public async fetchTspClasses(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const classes: RobjExportKlasse[] = (await client.exportKlasseList(lastChangeDate)).data;

		return classes;
	}

	public async findSchool(system: System, identifier: string): Promise<School | undefined> {
		const schools = await this.schoolService.getSchools({
			externalId: identifier,
			systemId: system.id,
		});

		if (schools.length === 0) {
			return undefined;
		}
		return schools[0];
	}

	public async findSchoolsForSystem(system: System): Promise<School[]> {
		const schools = await this.schoolService.getSchools({
			systemId: system.id,
		});

		return schools;
	}

	public async updateSchool(school: School, name?: string): Promise<School> {
		if (!name) {
			return school;
		}

		school.name = name;

		const updatedSchool = await this.schoolService.save(school);

		return updatedSchool;
	}

	public async createSchool(system: System, identifier: string, name: string): Promise<School> {
		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
		const federalState = await this.findFederalState();

		const school = SchoolFactory.build({
			externalId: identifier,
			name,
			systemIds: [system.id],
			federalState,
			currentYear: schoolYear,
			features: new Set([SchoolFeature.OAUTH_PROVISIONING_ENABLED]),
			createdAt: new Date(),
			updatedAt: new Date(),
			id: new ObjectId().toHexString(),
		});

		const savedSchool = await this.schoolService.save(school);

		return savedSchool;
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

		const externalClasses = new Map<string, ExternalUserDto>();
		const teacherForClasses = new Map<string, string>();

		tspClasses.forEach((tspClass) => {
			if (!tspClass.klasseId) {
				this.logger.info(new TspMissingExternalIdLoggable('class'));
				return;
			}

			const externalClass: ExternalClassDto = {
				externalId: tspClass.klasseId,
				name: tspClass.klasseName,
			};

			externalClasses.set(tspClass.klasseId, externalClass);

			if (tspClass.lehrerUid) {
				teacherForClasses.set(tspClass.lehrerUid, tspClass.klasseId);
			}
		});

		const oauthDataDtos: OauthDataDto[] = [];

		tspTeachers.forEach((tspTeacher) => {
			if (!tspTeacher.lehrerUid) {
				this.logger.info(new TspMissingExternalIdLoggable('teacher'));
				return;
			}

			const externalUser = new ExternalUserDto({
				externalId: tspTeacher.lehrerUid,
				firstName: tspTeacher.lehrerNachname,
				lastName: tspTeacher.lehrerNachname,
				roles: [RoleName.TEACHER],
				email: `tsp/${tspTeacher.lehrerUid}@schul-cloud.org`,
			});

			const classId = teacherForClasses.get(tspTeacher.lehrerUid);
			const classTeacher = classId == null ? undefined : externalClasses.get(classId);

			const externalSchool = tspTeacher.schuleNummer == null ? undefined : externalSchools.get(tspTeacher.schuleNummer);

			const oauthDataDto = new OauthDataDto({
				system: systemDto,
				externalUser,
				externalSchool,
				externalClasses: classTeacher ? [classTeacher] : [],
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
				firstName: tspStudent.schuelerNachname,
				lastName: tspStudent.schuelerNachname,
				roles: [RoleName.STUDENT],
				email: `tsp/${tspStudent.schuelerUid}@schul-cloud.org`,
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

	private async findFederalState(): Promise<FederalState> {
		if (this.federalState) {
			return this.federalState;
		}

		const federalStateEntity = await this.federalStateService.findFederalStateByName(FederalStateNames.THUERINGEN);
		this.federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
		return this.federalState;
	}

	private formatChangeDate(daysToFetch: number): string {
		return moment(new Date()).subtract(daysToFetch, 'days').subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss.SSS');
	}

	private createClient(system: System) {
		const client = this.tspClientFactory.createExportClient({
			clientId: system.oauthConfig?.clientId ?? '',
			clientSecret: system.oauthConfig?.clientSecret ?? '',
			tokenEndpoint: system.oauthConfig?.tokenEndpoint ?? '',
		});

		return client;
	}
}
