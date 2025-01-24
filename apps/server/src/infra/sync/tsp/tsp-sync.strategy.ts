import { Logger } from '@core/logger';
import { OauthDataDto } from '@modules/provisioning';
import { TspProvisioningService } from '@modules/provisioning/service/tsp-provisioning.service';
import { School } from '@modules/school';
import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pLimit from 'p-limit';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspUsersMigratedLoggable } from './loggable/tsp-users-migrated.loggable';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		private readonly tspFetchService: TspFetchService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		private readonly tspLegacyMigrationService: TspLegacyMigrationService,
		private readonly configService: ConfigService<TspSyncConfig, true>,
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
		const system = await this.tspSyncService.findTspSystemOrFail();

		await this.tspLegacyMigrationService.migrateLegacyData(system.id);

		await this.syncSchools(system);

		const schools = await this.tspSyncService.findSchoolsForSystem(system);

		if (this.configService.getOrThrow<boolean>('FEATURE_TSP_MIGRATION_ENABLED')) {
			await this.runMigration(system);
		}

		await this.syncData(system, schools);
	}

	private async syncSchools(system: System): Promise<School[]> {
		const schoolDaysToFetch = this.configService.getOrThrow<number>('TSP_SYNC_SCHOOL_DAYS_TO_FETCH');
		const tspSchools = await this.tspFetchService.fetchTspSchools(system, schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, schoolDaysToFetch));

		const schoolLimit = this.configService.getOrThrow<number>('TSP_SYNC_SCHOOL_LIMIT');
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

	private async syncData(system: System, schools: School[]): Promise<void> {
		const schoolDataDaysToFetch = this.configService.getOrThrow<number>('TSP_SYNC_DATA_DAYS_TO_FETCH');
		const tspTeachers = await this.tspFetchService.fetchTspTeachers(system, schoolDataDaysToFetch);
		const tspStudents = await this.tspFetchService.fetchTspStudents(system, schoolDataDaysToFetch);
		const tspClasses = await this.tspFetchService.fetchTspClasses(system, schoolDataDaysToFetch);
		this.logger.info(
			new TspDataFetchedLoggable(tspTeachers.length, tspStudents.length, tspClasses.length, schoolDataDaysToFetch)
		);

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

		let counter = 0;
		for await (const batch of batches) {
			counter += 1;
			const batchIndex = counter;
			await this.provisioningService.provisionBatch(batch);
			this.logger.info({
				getLogMessage() {
					return {
						message: `Finished batch ${batchIndex} of ${batchCount}`,
					};
				},
			});
		}

		// const results = await Promise.allSettled(dataPromises);

		// this.logger.info(new TspSyncedUsersLoggable(results.length));
	}

	private async runMigration(system: System): Promise<void> {
		const oldToNewMappings = new Map<string, string>();
		const teacherMigrations = await this.tspFetchService.fetchTspTeacherMigrations(system);
		teacherMigrations.forEach(({ lehrerUidAlt, lehrerUidNeu }) => {
			if (lehrerUidAlt && lehrerUidNeu) {
				oldToNewMappings.set(lehrerUidAlt, lehrerUidNeu);
			}
		});

		const studentsMigrations = await this.tspFetchService.fetchTspStudentMigrations(system);
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
