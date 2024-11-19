import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { UserDO } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';
import { Account } from '@src/modules/account';
import { ProvisioningService } from '@src/modules/provisioning';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
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

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: pLimit.Limit;

	private readonly dataLimit: pLimit.Limit;

	private readonly migrationLimit: pLimit.Limit;

	private readonly schoolDaysToFetch: number;

	private readonly schoolDataDaysToFetch: number;

	private readonly migrationEnabled: boolean;

	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
		private readonly tspLegacyMigrationService: TspLegacyMigrationService,
		configService: ConfigService<TspSyncConfig, true>,
		private readonly provisioningService: ProvisioningService
	) {
		super();
		this.logger.setContext(TspSyncStrategy.name);

		this.schoolLimit = pLimit(configService.getOrThrow<number>('TSP_SYNC_SCHOOL_LIMIT'));
		this.schoolDaysToFetch = configService.get<number>('TSP_SYNC_SCHOOL_DAYS_TO_FETCH', 1);

		this.dataLimit = pLimit(configService.getOrThrow<number>('TSP_SYNC_DATA_LIMIT'));
		this.schoolDataDaysToFetch = configService.get<number>('TSP_SYNC_DATA_DAYS_TO_FETCH', 1);

		this.migrationLimit = pLimit(configService.getOrThrow<number>('TSP_SYNC_MIGRATION_LIMIT'));
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
		const tspSchools = await this.tspSyncService.fetchTspSchools(system, this.schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, this.schoolDaysToFetch));

		const schoolPromises = tspSchools.map((tspSchool) =>
			this.schoolLimit(async () => {
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
		const tspTeachers = await this.tspSyncService.fetchTspTeachers(system, this.schoolDataDaysToFetch);
		const tspStudents = await this.tspSyncService.fetchTspStudents(system, this.schoolDataDaysToFetch);
		const tspClasses = await this.tspSyncService.fetchTspClasses(system, this.schoolDataDaysToFetch);
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

		const dataPromises = oauthDataDtos.map((oauthDataDto) =>
			this.dataLimit(() => this.provisioningService.provisionData(oauthDataDto))
		);

		const results = await Promise.allSettled(dataPromises);

		this.logger.info(new TspSyncedUsersLoggable(results.length));
	}

	private async migrateTspTeachers(system: System): Promise<{ total: number }> {
		const tspTeacherIds = await this.tspSyncService.fetchTspTeacherMigrations(system);
		this.logger.info(new TspTeachersFetchedLoggable(tspTeacherIds.length));

		const teacherMigrationPromises = tspTeacherIds.map(({ lehrerUidAlt, lehrerUidNeu }) =>
			this.migrationLimit(async () => {
				if (lehrerUidAlt && lehrerUidNeu) {
					await this.migrateTspUser(lehrerUidAlt, lehrerUidNeu, system.id);
					return true;
				}
				return false;
			})
		);

		const migratedTspTeachers = await Promise.allSettled(teacherMigrationPromises);

		const total = migratedTspTeachers.filter((result) => result.status === 'fulfilled' && result.value === true).length;
		this.logger.info(new TspTeachersMigratedLoggable(total));

		return { total };
	}

	private async migrateTspStudents(system: System): Promise<{ total: number }> {
		const tspStudentIds = await this.tspSyncService.fetchTspStudentMigrations(system);
		this.logger.info(new TspStudentsFetchedLoggable(tspStudentIds.length));

		const studentMigrationPromises = tspStudentIds.map(({ schuelerUidAlt, schuelerUidNeu }) =>
			this.migrationLimit(async () => {
				if (schuelerUidAlt && schuelerUidNeu) {
					await this.migrateTspUser(schuelerUidAlt, schuelerUidNeu, system.id);
					return true;
				}
				return false;
			})
		);

		const migratedStudents = await Promise.allSettled(studentMigrationPromises);

		const total = migratedStudents.filter((result) => result.status === 'fulfilled' && result.value === true).length;
		this.logger.info(new TspStudentsMigratedLoggable(total));

		return { total };
	}

	private async migrateTspUser(
		oldUid: string,
		newUid: string,
		systemId: string
	): Promise<{ updatedUser: UserDO; updatedAccount: Account }> {
		const newEmailAndUsername = `${newUid}@schul-cloud.org`;
		const user = await this.tspSyncService.findUserByTspUid(oldUid);

		if (!user) {
			throw new NotFoundLoggableException(UserDO.name, { oldUid });
		}

		const newEmail = newEmailAndUsername;
		const updatedUser = await this.tspSyncService.updateUser(user, newEmail, newUid, oldUid);

		const account = await this.tspSyncService.findAccountByExternalId(newUid, systemId);

		if (!account) {
			throw new NotFoundLoggableException(Account.name, { oldUid });
		}

		const newUsername = newEmailAndUsername;
		const updatedAccount = await this.tspSyncService.updateAccount(account, newUsername, systemId);

		return { updatedUser, updatedAccount };
	}
}
