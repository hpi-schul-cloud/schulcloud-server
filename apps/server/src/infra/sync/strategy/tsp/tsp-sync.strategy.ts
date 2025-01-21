import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { RobjExportKlasse, RobjExportLehrer, RobjExportSchueler } from '@src/infra/tsp-client';
import { ProvisioningService } from '@src/modules/provisioning';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { SyncStrategy } from '../sync-strategy';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspUsersMigratedLoggable } from './loggable/tsp-users-migrated.loggable';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';

type TspSchoolData = {
	tspTeachers: RobjExportLehrer[];
	tspStudents: RobjExportSchueler[];
	tspClasses: RobjExportKlasse[];
};

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		private readonly tspFetchService: TspFetchService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		private readonly tspLegacyMigrationService: TspLegacyMigrationService,
		private readonly configService: ConfigService<TspSyncConfig, true>,
		private readonly provisioningService: ProvisioningService,
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
		const system = await this.tspSyncService.findTspSystemOrFail();

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

		const dataLimit = this.configService.getOrThrow('TSP_SYNC_DATA_LIMIT', { infer: true });
		const dataLimitFn = pLimit(dataLimit);
		const dataPromises = oauthDataDtos.map((oauthDataDto) =>
			dataLimitFn(() => this.provisioningService.provisionData(oauthDataDto))
		);
		const results = await Promise.allSettled(dataPromises);

		this.logger.info(new TspSyncedUsersLoggable(results.length));
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
}
