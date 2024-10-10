import { RobjExportSchule, TspClientFactory } from '@infra/tsp-client';
import { FederalStateService, SchoolYearService } from '@modules/legacy-school';
import { School, SchoolService } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolFeature } from '@shared/domain/types';
import { FederalStateNames } from '@src/modules/legacy-school/types';
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

	public async fetchTspSchools(system: System) {
		const client = this.tspClientFactory.createExportClient({
			clientId: system.oauthConfig?.clientId ?? '',
			clientSecret: system.oauthConfig?.clientSecret ?? '',
			tokenEndpoint: system.oauthConfig?.tokenEndpoint ?? '',
		});

		const lastChangeDate = this.formatChangeDate(new Date(0));
		const schools: RobjExportSchule[] = (await client.exportSchuleList(lastChangeDate)).data;

		return schools;
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

	public async updateSchool(school: School, name: string): Promise<School> {
		school.name = name;

		const updatedSchool = await this.schoolService.save(school);

		return updatedSchool;
	}

	public async createSchool(system: System, identifier: string, name: string): Promise<School> {
		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);

		const school = SchoolFactory.build({
			externalId: identifier,
			name,
			systemIds: [system.id],
			federalState: await this.findFederalState(),
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

	private formatChangeDate(date: Date): string {
		return moment(date).format('YYYY-MM-DD HH:mm:ss.SSS');
	}
}
