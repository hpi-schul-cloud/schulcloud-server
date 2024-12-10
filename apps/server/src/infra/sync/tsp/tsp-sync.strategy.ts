import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { UserDO } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';
import { Account } from '@src/modules/account';
import { ProvisioningService } from '@src/modules/provisioning';
import { System } from '@src/modules/system';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspStudentsFetchedLoggable } from './loggable/tsp-students-fetched.loggable';
import { TspStudentsMigratedLoggable } from './loggable/tsp-students-migrated.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspTeachersFetchedLoggable } from './loggable/tsp-teachers-fetched.loggable';
import { TspTeachersMigratedLoggable } from './loggable/tsp-teachers-migrated.loggable';
import { TspUsersMigratedLoggable } from './loggable/tsp-users-migrated.loggable';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspFetchService } from './tsp-fetch.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: number;

	private readonly dataLimit: number;

	private readonly migrationLimit: number;

	private readonly schoolDaysToFetch: number;

	private readonly schoolDataDaysToFetch: number;

	private readonly migrationEnabled: boolean;

	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		private readonly tspFetchService: TspFetchService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		private readonly tspLegacyMigrationService: TspLegacyMigrationService,
		configService: ConfigService<TspSyncConfig, true>,
		private readonly provisioningService: ProvisioningService
	) {
		super();
		this.logger.setContext(TspSyncStrategy.name);

		this.schoolLimit = configService.getOrThrow<number>('TSP_SYNC_SCHOOL_LIMIT');
		this.schoolDaysToFetch = configService.get<number>('TSP_SYNC_SCHOOL_DAYS_TO_FETCH', 1);

		this.dataLimit = configService.getOrThrow<number>('TSP_SYNC_DATA_LIMIT');
		this.schoolDataDaysToFetch = configService.get<number>('TSP_SYNC_DATA_DAYS_TO_FETCH', 1);

		this.migrationLimit = configService.getOrThrow<number>('TSP_SYNC_MIGRATION_LIMIT');
		this.migrationEnabled = configService.get<boolean>('FEATURE_TSP_MIGRATION_ENABLED', false);
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	public async sync(): Promise<void> {
		const system = await this.tspSyncService.findTspSystemOrFail();

		await this.tspLegacyMigrationService.migrateLegacyData(system.id);

		await this.syncSchools(system);

		const schools = await this.tspSyncService.findSchoolsForSystem(system);

		if (this.migrationEnabled) {
			const teacherMigrationResult = await this.migrateTspTeachers(system);
			const studentMigrationResult = await this.migrateTspStudents(system);
			const totalMigrations = teacherMigrationResult.total + studentMigrationResult.total;
			this.logger.info(new TspUsersMigratedLoggable(totalMigrations));
		}

		await this.syncData(system, schools);
	}

	private async syncSchools(system: System): Promise<School[]> {
		const tspSchools = await this.tspFetchService.fetchTspSchools(system, this.schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, this.schoolDaysToFetch));

		const schoolPromises = tspSchools.map(async (tspSchool) => {
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
		});

		const scSchools = await Promise.all(schoolPromises);

		const total = tspSchools.length;
		const totalProcessed = scSchools.filter((scSchool) => scSchool != null).length;
		const createdSchools = scSchools.filter((scSchool) => scSchool != null && scSchool.created).length;
		const updatedSchools = scSchools.filter((scSchool) => scSchool != null && !scSchool.created).length;
		this.logger.info(new TspSchoolsSyncedLoggable(total, totalProcessed, createdSchools, updatedSchools));

		return scSchools.filter((scSchool) => scSchool != null).map((scSchool) => scSchool.school);
	}

	private async syncData(system: System, schools: School[]): Promise<void> {
		const tspTeachers = await this.tspFetchService.fetchTspTeachers(system, this.schoolDataDaysToFetch);
		const tspStudents = await this.tspFetchService.fetchTspStudents(system, this.schoolDataDaysToFetch);
		const tspClasses = await this.tspFetchService.fetchTspClasses(system, this.schoolDataDaysToFetch);
		this.logger.info(
			new TspDataFetchedLoggable(tspTeachers.length, tspStudents.length, tspClasses.length, this.schoolDataDaysToFetch)
		);

		const oauthDataDtos = this.tspOauthDataMapper.mapTspDataToOauthData(
			system,
			schools,
			tspTeachers,
			tspStudents,
			tspClasses
		);

		this.logger.info(new TspSyncingUsersLoggable(oauthDataDtos.length));

		const dataPromises = oauthDataDtos.map((oauthDataDto) => this.provisioningService.provisionData(oauthDataDto));

		const results = await Promise.allSettled(dataPromises);

		this.logger.info(new TspSyncedUsersLoggable(results.length));
	}

	private async migrateTspTeachers(system: System): Promise<{ total: number }> {
		const tspTeacherIds = await this.tspFetchService.fetchTspTeacherMigrations(system);
		this.logger.info(new TspTeachersFetchedLoggable(tspTeacherIds.length));

		const batches = Math.ceil(tspTeacherIds.length / this.migrationLimit);

		let total = 0;
		for await (const batch of Array.from(Array(batches).keys())) {
			const currentBatch = tspTeacherIds.slice(batch * this.migrationLimit, (batch + 1) * this.migrationLimit);
			const teacherMigrationPromises = currentBatch.map(async ({ lehrerUidAlt, lehrerUidNeu }) => {
				if (lehrerUidAlt && lehrerUidNeu) {
					await this.migrateTspUser(lehrerUidAlt, lehrerUidNeu, system.id);
					return true;
				}
				return false;
			});
			const migratedTspTeachers = await Promise.allSettled(teacherMigrationPromises);
			const batchSuccess = migratedTspTeachers.filter(
				(result) => result.status === 'fulfilled' && result.value === true
			).length;
			const batchFulfilled = migratedTspTeachers.filter((result) => result.status === 'fulfilled').length;
			const batchTotal = migratedTspTeachers.length;
			const batchSize = currentBatch.length;

			total += batchSuccess;

			const msg = `Batch ${batch} of ${batches} done: This batch: Successful:${batchSuccess}, Fulfilled: ${batchFulfilled}, BatchTotal: ${batchTotal}, BatchSize: ${batchSize} , Total: ${total}`;
			this.logger.info({
				getLogMessage() {
					return {
						message: msg,
					};
				},
			});
		}

		this.logger.info(new TspTeachersMigratedLoggable(total));

		return { total };
	}

	private async migrateTspStudents(system: System): Promise<{ total: number }> {
		const tspStudentIds = await this.tspFetchService.fetchTspStudentMigrations(system);
		this.logger.info(new TspStudentsFetchedLoggable(tspStudentIds.length));

		const studentMigrationPromises = tspStudentIds.map(async ({ schuelerUidAlt, schuelerUidNeu }) => {
			if (schuelerUidAlt && schuelerUidNeu) {
				await this.migrateTspUser(schuelerUidAlt, schuelerUidNeu, system.id);
				return true;
			}
			return false;
		});

		const migratedStudents = await Promise.allSettled(studentMigrationPromises);

		const total = migratedStudents.filter((result) => result.status === 'fulfilled' && result.value === true).length;
		this.logger.info(new TspStudentsMigratedLoggable(total));

		return { total };
	}

	private async migrateTspUser(
		oldUid: string,
		newUid: string,
		systemId: string
	): Promise<{ updatedUser: UserDO; updatedAccount: Account } | null> {
		try {
			const newEmailAndUsername = `${newUid}@schul-cloud.org`;
			const user = await this.tspSyncService.findUserByTspUid(oldUid);

			console.log(`User found: ${user?.id ?? 'No Id'}`);
			if (!user) {
				throw new NotFoundLoggableException(UserDO.name, { oldUid });
			}

			const newEmail = newEmailAndUsername;
			const updatedUser = await this.tspSyncService.updateUser(user, newEmail, newUid, oldUid);
			console.log(`User updated: ${user?.id ?? 'No Id'}`);

			const account = await this.tspSyncService.findAccountByExternalId(newUid, systemId);

			console.log(`Account found: ${account?.id ?? 'No Id'}`);

			if (!account) {
				throw new NotFoundLoggableException(Account.name, { oldUid });
			}

			const newUsername = newEmailAndUsername;
			const updatedAccount = await this.tspSyncService.updateAccount(account, newUsername, systemId);

			console.log(`Account updated: ${account?.id ?? 'No Id'}`);

			return { updatedUser, updatedAccount };
		} catch (e) {
			console.log(`An error occurred: ${JSON.stringify(e)}`);
		}
		return null;
	}
}
