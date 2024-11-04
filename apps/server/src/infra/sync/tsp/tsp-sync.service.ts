import { TspClientFactory } from '@infra/tsp-client';
import { FederalStateService, SchoolYearService } from '@modules/legacy-school';
import { School, SchoolService } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { FederalStateNames } from '@src/modules/legacy-school/types';
// TODO: do not deep import from modules. These things should probably be publicly exported by the school module.
import { FederalState } from '@src/modules/school/domain';
import { SchoolFactory } from '@src/modules/school/domain/factory';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
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
		private readonly schoolYearService: SchoolYearService
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

	// TODO: move these functions into a tsp adapter

	public async fetchTspSchools(system: System, daysToFetch: number) {
		// HINT: lots of duplicated code. could be done with currying or functions as parameters
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

		// TODO: look at current db entries and check if the newly created ones look similar. If any things change, make sure its consistent with all code and migrate
		// TODO: filestorage provider seems to be missing, maybe also others? schoolModule should probably handle that...
		// TODO: what about permissions? anyway, compare freshly created db entries for old and new sync :)

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

	/*
	TODO: when tsp stuff is out of this file, this can be a "TspSchoolService" (in preperation of a refactoring in the school module).
	It would greatly help us if tsp specific details like FederalStateNames.THUERINGEN could be moved into a parameter or otherwise out of this file.
	*/
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
