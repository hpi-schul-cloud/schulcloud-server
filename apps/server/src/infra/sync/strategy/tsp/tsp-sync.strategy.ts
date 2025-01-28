import { Logger } from '@core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '@infra/tsp-client';
import { OauthDataDto } from '@modules/provisioning';
import { TspProvisioningService } from '@modules/provisioning/service/tsp-provisioning.service';
import { School } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import pLimit from 'p-limit';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { SyncStrategy } from '../sync-strategy';
import { TspSystemNotFoundLoggableException } from './loggable';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspDataSyncBatchFinishedLoggable } from './loggable/tsp-data-sync-batch-finished.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspUsersMigratedLoggable } from './loggable/tsp-users-migrated.loggable';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSchoolService } from './tsp-school.service';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';

type TspSchoolData = {
	tspTeachers: RobjExportLehrer[];
	tspStudents: RobjExportSchueler[];
	tspClasses: RobjExportKlasse[];
};

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSchoolService,
		private readonly tspFetchService: TspFetchService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		private readonly tspLegacyMigrationService: TspLegacyMigrationService,
		private readonly configService: ConfigService<TspSyncConfig, true>,
		private readonly systemService: SystemService,
		private readonly provisioningService: TspProvisioningService,
		private readonly tspSyncMigrationService: TspSyncMigrationService
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

		await this.tspLegacyMigrationService.prepareLegacySyncDataForNewSync(system.id);

		await this.syncTspSchools(system);

		const schools = await this.tspSyncService.findAllSchoolsForSystem(system);

		if (this.configService.getOrThrow('FEATURE_TSP_MIGRATION_ENABLED', { infer: true })) {
			await this.runMigrationOfExistingUsers(system);
		}

		await this.syncDataOfSyncedTspSchools(system, schools);
	}

	private async syncTspSchools(system: System): Promise<School[]> {
		const schoolDaysToFetch = this.configService.getOrThrow('TSP_SYNC_SCHOOL_DAYS_TO_FETCH', { infer: true });
		const tspSchools = await this.tspFetchService.fetchTspSchools(system, schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, schoolDaysToFetch));

		const schoolLimit = this.configService.getOrThrow('TSP_SYNC_SCHOOL_LIMIT', { infer: true });
		const schoolLimitFn = pLimit(schoolLimit);

		const schoolPromises = tspSchools.map((tspSchool) =>
			schoolLimitFn(async () => {
				if (!tspSchool.schuleNummer) {
					this.logger.warning(new TspSchulnummerMissingLoggable(tspSchool.schuleName));
					return null;
				}

				const existingSchool = await this.tspSyncService.findSchool(system, tspSchool.schuleNummer);

				if (existingSchool) {
					const updatedSchool = await this.tspSyncService.updateSchool(existingSchool, tspSchool.schuleName);
					return { school: updatedSchool, created: false };
				}

				const createdSchool = await this.tspSyncService.createSchool(
					system,
					tspSchool.schuleNummer,
					tspSchool.schuleName ?? ''
				);
				return { school: createdSchool, created: true };
			})
		);

		const scSchools = await Promise.all(schoolPromises);

		const total = tspSchools.length;
		const totalProcessed = scSchools.filter((scSchool) => scSchool != null).length;
		const createdSchools = scSchools.filter((scSchool) => scSchool != null && scSchool.created).length;
		const updatedSchools = scSchools.filter((scSchool) => scSchool != null && !scSchool.created).length;
		this.logger.info(new TspSchoolsSyncedLoggable(total, totalProcessed, createdSchools, updatedSchools));

		return scSchools.filter((scSchool) => scSchool != null).map((scSchool) => scSchool.school);
	}

	private async syncDataOfSyncedTspSchools(system: System, schools: School[]): Promise<void> {
		const { tspTeachers, tspStudents, tspClasses } = await this.fetchSchoolData(system);

		const oauthDataDtos = this.tspOauthDataMapper.mapTspDataToOauthData(
			system,
			schools,
			tspTeachers,
			tspStudents,
			tspClasses
		);

		this.logger.info(new TspSyncingUsersLoggable(oauthDataDtos.length));

		const batchSize = this.configService.getOrThrow<number>('TSP_SYNC_DATA_LIMIT');

		const batchCount = Math.ceil(oauthDataDtos.length / batchSize);
		const batches: OauthDataDto[][] = [];
		for (let i = 0; i < batchCount; i += 1) {
			const start = i * batchSize;
			const end = Math.min((i + 1) * batchSize, oauthDataDtos.length);
			batches.push(oauthDataDtos.slice(start, end));
		}

		const batchLimit = pLimit(1);
		const batchPromises = batches.map((batch, index) =>
			batchLimit(async () => {
				const processed = await this.provisioningService.provisionBatch(batch);
				this.logger.info(new TspDataSyncBatchFinishedLoggable(processed, batchSize, batchCount, index));
				return processed;
			})
		);

		const results = await Promise.all(batchPromises);
		const total = results.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

		this.logger.info(new TspSyncedUsersLoggable(total));
	}

	private async fetchSchoolData(system: System): Promise<TspSchoolData> {
		const schoolDataDaysToFetch = this.configService.getOrThrow('TSP_SYNC_DATA_DAYS_TO_FETCH', { infer: true });
		const [tspTeachers, tspStudents, tspClasses] = await Promise.all([
			this.tspFetchService.fetchTspTeachers(system, schoolDataDaysToFetch),
			this.tspFetchService.fetchTspStudents(system, schoolDataDaysToFetch),
			this.tspFetchService.fetchTspClasses(system, schoolDataDaysToFetch),
		]);
		this.logger.info(
			new TspDataFetchedLoggable(tspTeachers.length, tspStudents.length, tspClasses.length, schoolDataDaysToFetch)
		);

		return { tspTeachers, tspStudents, tspClasses };
	}

	private async runMigrationOfExistingUsers(system: System): Promise<void> {
		const oldToNewMappings = new Map<string, string>();
		const [teacherMigrations, studentsMigrations] = await Promise.all([
			this.tspFetchService.fetchTspTeacherMigrations(system),
			this.tspFetchService.fetchTspStudentMigrations(system),
		]);

		teacherMigrations.forEach(({ lehrerUidAlt, lehrerUidNeu }) => {
			if (lehrerUidAlt && lehrerUidNeu) {
				oldToNewMappings.set(lehrerUidAlt, lehrerUidNeu);
			}
		});
		studentsMigrations.forEach(({ schuelerUidAlt, schuelerUidNeu }) => {
			if (schuelerUidAlt && schuelerUidNeu) {
				oldToNewMappings.set(schuelerUidAlt, schuelerUidNeu);
			}
		});

		const migrationResult = await this.tspSyncMigrationService.migrateTspUsers(system, oldToNewMappings);
		this.logger.info(
			new TspUsersMigratedLoggable(
				migrationResult.totalAmount,
				migrationResult.totalUsers,
				migrationResult.totalAccounts
			)
		);
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
