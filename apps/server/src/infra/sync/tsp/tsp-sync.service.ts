import { TspClientFactory } from '@infra/tsp-client';
import { FederalStateService, SchoolYearService } from '@modules/legacy-school';
import { School, SchoolService } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { Account, AccountService } from '@src/modules/account';
import { FederalStateNames } from '@src/modules/legacy-school/types';
import { OauthConfigMissingLoggableException } from '@src/modules/oauth/loggable';
import { FederalState } from '@src/modules/school/domain';
import { SchoolFactory } from '@src/modules/school/domain/factory';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { UserService } from '@src/modules/user';
import { AxiosError } from 'axios';
import { ObjectId } from 'bson';
import moment from 'moment/moment';
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
		private readonly userService: UserService,
		private readonly accountService: AccountService
	) {}

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
		const schoolsResponse = await client.exportSchuleList(lastChangeDate);
		const schools = schoolsResponse.data;

		return schools;
	}

	public async fetchTspTeachers(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const teachersResponse = await client.exportLehrerList(lastChangeDate);
		const teachers = teachersResponse.data;

		return teachers;
	}

	public async fetchTspStudents(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const studentsResponse = await client.exportSchuelerList(lastChangeDate);
		const students = studentsResponse.data;

		return students;
	}

	public async fetchTspClasses(system: System, daysToFetch: number) {
		const client = this.createClient(system);

		const lastChangeDate = this.formatChangeDate(daysToFetch);
		const classesResponse = await client.exportKlasseList(lastChangeDate);
		const classes = classesResponse.data;

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

	private async findFederalState(): Promise<FederalState> {
		if (this.federalState) {
			return this.federalState;
		}

		const federalStateEntity = await this.federalStateService.findFederalStateByName(FederalStateNames.THUERINGEN);
		this.federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
		return this.federalState;
	}

	public async fetchTspTeacherMigrations(system: System) {
		const client = this.createClient(system);

		const teacherMigrationsResponse = await client.exportLehrerListMigration();
		const teacherMigrations = teacherMigrationsResponse.data;

		return teacherMigrations;
	}

	public async fetchTspStudentMigrations(system: System) {
		const client = this.createClient(system);

		try {
			const studentMigrationsResponse = await client.exportSchuelerListMigration();
			const studentMigrations = studentMigrationsResponse.data;

			return studentMigrations;
		} catch (error) {
			if (error instanceof AxiosError) {
				console.log(error.response?.data);
			}
			return [];
		}
	}

	public async findUserByTspUid(tspUid: string): Promise<UserDO | null> {
		const tspUser = await this.userService.findUsers({ tspUid });

		if (tspUser.data.length === 0) {
			return null;
		}

		return tspUser.data[0];
	}

	public async findAccountByTspUid(tspUid: string): Promise<Account | null> {
		const user = await this.findUserByTspUid(tspUid);

		if (!user || !user.id) {
			return null;
		}

		const account = await this.accountService.findByUserId(user.id);

		return account;
	}

	public async updateUser(
		user: UserDO,
		email: string,
		externalId: string,
		previousExternalId: string
	): Promise<UserDO> {
		user.email = email;
		user.externalId = externalId;
		user.previousExternalId = previousExternalId;

		return this.userService.save(user);
	}

	public async updateAccount(account: Account, username: string, systemId: string): Promise<Account> {
		account.username = username;
		account.systemId = systemId;

		return this.accountService.save(account);
	}

	private formatChangeDate(daysToFetch: number): string {
		return moment(new Date()).subtract(daysToFetch, 'days').subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss.SSS');
	}

	private createClient(system: System) {
		if (!system.oauthConfig) {
			throw new OauthConfigMissingLoggableException(system.id);
		}

		const client = this.tspClientFactory.createExportClient({
			clientId: system.oauthConfig.clientId,
			clientSecret: system.oauthConfig.clientSecret,
			tokenEndpoint: system.oauthConfig.tokenEndpoint,
		});

		return client;
	}
}
