import { Logger } from '@core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler, RobjExportSchule } from '@infra/tsp-client';
import { ExternalClassDto, OauthDataDto } from '@modules/provisioning';
import { BadDataLoggableException } from '@modules/provisioning/loggable';
import { TspProvisioningService } from '@modules/provisioning/service/tsp-provisioning.service';
import { School } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Inject, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import pLimit from 'p-limit';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { SYNC_CONFIG_TOKEN, SyncConfig } from '../../sync.config';
import { SyncStrategy } from '../sync-strategy';
import {
	TspClassSyncBatchLoggable,
	TspClassSyncStartLoggable,
	TspClassSyncSummaryLoggable,
	TspSystemNotFoundLoggableException,
} from './loggable';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspDataSyncBatchFinishedLoggable } from './loggable/tsp-data-sync-batch-finished.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspFetchService } from './tsp-fetch.service';
import { TspOauthDataMapper, TspUserInfo } from './tsp-oauth-data.mapper';
import { TspSchoolService } from './tsp-school.service';

type TspSchoolData = {
	tspTeachers: RobjExportLehrer[];
	tspStudents: RobjExportSchueler[];
	tspClasses: RobjExportKlasse[];
};

type RobjExportSchuleWithNummer = RobjExportSchule & {
	schuleNummer: string;
};

type SchoolSyncResult = { school: School; created: boolean };

function isRobjExportSchuleWithNummer(school: RobjExportSchule): school is RobjExportSchuleWithNummer {
	return !!school.schuleNummer;
}

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	constructor(
		private readonly logger: Logger,
		private readonly tspSchoolService: TspSchoolService,
		private readonly tspFetchService: TspFetchService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		@Inject(SYNC_CONFIG_TOKEN) private readonly config: SyncConfig,
		private readonly systemService: SystemService,
		private readonly provisioningService: TspProvisioningService
	) {
		super();
		this.logger.setContext(TspSyncStrategy.name);
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	public async sync(): Promise<void> {
		// Please keep the order of this steps/methods as each relies on the data processed in the ones before.
		const system = await this.findTspSystemOrFail();

		await this.syncTspSchools(system);

		await this.syncUsersAndClasses(system);
	}

	private async syncTspSchools(system: System): Promise<void> {
		const { schoolDaysToFetch } = this.config;
		const tspSchools = await this.tspFetchService.fetchTspSchools(system, schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, schoolDaysToFetch));

		const validSchools = this.filterValidTspSchools(tspSchools);

		const schoolResults = await this.updateOrCreateSchoolsBatched(validSchools, system);

		this.logMetrics(tspSchools, schoolResults);
	}

	private filterValidTspSchools(tspSchools: RobjExportSchule[]): RobjExportSchuleWithNummer[] {
		const withoutSchulnummer = tspSchools.filter((tspSchool) => !tspSchool.schuleNummer);
		if (withoutSchulnummer.length > 0) {
			this.logger.warning(new TspSchulnummerMissingLoggable(withoutSchulnummer));
		}

		const validSchools = tspSchools.filter(isRobjExportSchuleWithNummer);

		return validSchools;
	}

	private async updateOrCreateSchoolsBatched(
		tspSchools: RobjExportSchuleWithNummer[],
		system: System
	): Promise<SchoolSyncResult[]> {
		const { schoolLimit } = this.config;
		const promiseLimiter = pLimit(schoolLimit);

		const schoolPromises = tspSchools.map((tspSchool) =>
			promiseLimiter(() => this.updateOrCreateSchool(tspSchool, system))
		);
		const schools = await Promise.all(schoolPromises);

		return schools;
	}

	private async updateOrCreateSchool(tspSchool: RobjExportSchuleWithNummer, system: System): Promise<SchoolSyncResult> {
		const existingSchool = await this.tspSchoolService.findSchool(system, tspSchool.schuleNummer);

		if (existingSchool) {
			const updatedSchool = await this.tspSchoolService.updateSchool(existingSchool, tspSchool.schuleName);
			return { school: updatedSchool, created: false };
		}

		const createdSchool = await this.tspSchoolService.createSchool(
			system,
			tspSchool.schuleNummer,
			tspSchool.schuleName ?? ''
		);

		return { school: createdSchool, created: true };
	}

	private logMetrics(tspSchools: RobjExportSchule[], scSchools: SchoolSyncResult[]): void {
		const total = tspSchools.length;
		const totalProcessed = scSchools.length;
		const createdSchools = scSchools.filter((scSchool) => scSchool.created).length;
		const updatedSchools = scSchools.filter((scSchool) => !scSchool.created).length;

		this.logger.info(new TspSchoolsSyncedLoggable(total, totalProcessed, createdSchools, updatedSchools));
	}

	private async syncUsersAndClasses(system: System): Promise<void> {
		const schools = await this.tspSchoolService.findAllSchoolsForSystem(system);
		const { tspTeachers, tspStudents, tspClasses } = await this.fetchSchoolData(system);

		const schoolsByExternalId = new Map<string, School>();

		schools.forEach((school) => {
			if (!school.externalId) {
				throw new BadDataLoggableException('School has no externalId');
			}
			schoolsByExternalId.set(school.externalId, school);
		});

		const { oauthDataDtos, usersOfClasses } = this.tspOauthDataMapper.mapTspDataToOauthData(
			system,
			schools,
			tspTeachers,
			tspStudents,
			tspClasses
		);

		this.logger.info(new TspSyncingUsersLoggable(oauthDataDtos.length));

		const { dataLimit } = this.config;
		const userBatches = this.createBatches(dataLimit, oauthDataDtos);

		const totalUsers = await this.runSyncOfOauthDataBatches(dataLimit, userBatches, schoolsByExternalId);
		this.logger.info(new TspSyncedUsersLoggable(totalUsers));

		const classesForSchools = this.groupClassesBySchool(oauthDataDtos);
		this.logger.info(new TspClassSyncStartLoggable(tspClasses.length));
		await this.runClassGrouping(classesForSchools, schoolsByExternalId, usersOfClasses);
	}

	private groupClassesBySchool(oauthDataDtos: OauthDataDto[]): Map<string, Set<ExternalClassDto>> {
		const classesForSchools = new Map<string, Set<ExternalClassDto>>();

		oauthDataDtos.forEach((oauthDataDto) => {
			const schoolId = oauthDataDto.externalSchool?.externalId;
			if (!schoolId) {
				throw new BadDataLoggableException('School has no externalId');
			}

			let classesInSchool = classesForSchools.get(schoolId);

			if (!classesInSchool) {
				classesInSchool = new Set<ExternalClassDto>();
				classesForSchools.set(schoolId, classesInSchool);
			}

			oauthDataDto.externalClasses?.forEach((externalClass) => classesInSchool.add(externalClass));
		});

		return classesForSchools;
	}

	private async runClassGrouping(
		classesForSchools: Map<string, Set<ExternalClassDto>>,
		schoolsByExternalId: Map<string, School>,
		usersOfClasses: Map<string, TspUserInfo[]>
	): Promise<void> {
		let totalClassCreationCount = 0;
		let totalClassUpdateCount = 0;
		const fullSync = this.config.dataDaysToFetch === -1;

		// Each batch should be processed after another
		for await (const [schoolExternalId, classes] of classesForSchools.entries()) {
			const school = schoolsByExternalId.get(schoolExternalId);
			if (!school) {
				throw new NotFoundLoggableException('school', {
					externalId: schoolExternalId,
				});
			}

			const { classUpdateCount, classCreationCount } = await this.provisioningService.provisionClassBatch(
				school,
				Array.from(classes),
				usersOfClasses,
				fullSync
			);
			totalClassUpdateCount += classUpdateCount;
			totalClassCreationCount += classCreationCount;

			this.logger.info(new TspClassSyncBatchLoggable(classUpdateCount, classCreationCount, schoolExternalId));
		}

		this.logger.info(new TspClassSyncSummaryLoggable(totalClassUpdateCount, totalClassCreationCount));
	}

	private createBatches<T>(batchSize: number, data: T[]): T[][] {
		const batchCount = Math.ceil(data.length / batchSize);
		const batches: T[][] = [];
		for (let i = 0; i < batchCount; i += 1) {
			const start = i * batchSize;
			const end = Math.min((i + 1) * batchSize, data.length);
			batches.push(data.slice(start, end));
		}
		return batches;
	}

	private async runSyncOfOauthDataBatches(
		batchSize: number,
		batches: OauthDataDto[][],
		schools: Map<string, School>
	): Promise<number> {
		const batchLimit = pLimit(1);
		const batchPromises = batches.map((batch, index) =>
			batchLimit(async () => {
				const processed = await this.provisioningService.provisionUserBatch(batch, schools);
				this.logger.info(new TspDataSyncBatchFinishedLoggable(processed, batchSize, batches.length, index + 1));
				return processed;
			})
		);

		const results = await Promise.all(batchPromises);
		const total = results.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

		return total;
	}

	private async fetchSchoolData(system: System): Promise<TspSchoolData> {
		const { dataDaysToFetch } = this.config;
		const [tspTeachers, tspStudents, tspClasses] = await Promise.all([
			this.tspFetchService.fetchTspTeachers(system, dataDaysToFetch),
			this.tspFetchService.fetchTspStudents(system, dataDaysToFetch),
			this.tspFetchService.fetchTspClasses(system, dataDaysToFetch),
		]);
		this.logger.info(
			new TspDataFetchedLoggable(tspTeachers.length, tspStudents.length, tspClasses.length, dataDaysToFetch)
		);

		return { tspTeachers, tspStudents, tspClasses };
	}

	private async findTspSystemOrFail(): Promise<System> {
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
}
