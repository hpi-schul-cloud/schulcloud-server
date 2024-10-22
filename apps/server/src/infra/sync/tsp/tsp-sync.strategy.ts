import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { ProvisioningService } from '@src/modules/provisioning';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: pLimit.Limit;

	private readonly dataLimit: pLimit.Limit;

	private readonly migrationLimit: pLimit.Limit;

	private readonly schoolDaysToFetch: number;

	private readonly schoolDataDaysToFetch: number;

	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		private readonly tspOauthDataMapper: TspOauthDataMapper,
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
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	public async sync(): Promise<void> {
		const system = await this.tspSyncService.findTspSystemOrFail();

		await this.migrateUserIds(system);

		await this.syncSchools(system);

		const schools = await this.tspSyncService.findSchoolsForSystem(system);

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

	private async migrateUserIds(system: System): Promise<void> {
		const TspTeacherIds = await this.tspSyncService.fetchTspTeacherMigrations(system);

		const TspStudentIds = await this.tspSyncService.fetchTspStudentMigrations(system);

		for await (const { lehrerUidAlt, lehrerUidNeu } of TspTeacherIds) {
			if (lehrerUidAlt && lehrerUidNeu) {
				await this.migrateTeacher(lehrerUidAlt, lehrerUidNeu, system.id);
			}
		}

		for await (const { schuelerUidAlt, schuelerUidNeu } of TspStudentIds) {
			// migrateStudent
		}
	}

	private async migrateTeacher(lehrerUidAlt: string, lehrerUidNeu: string, systemId: string) {
		const newEmailAndUsername = `${lehrerUidNeu}@schul-cloud.org`;

		const teacherUser = await this.tspSyncService.findUserByTspUid(lehrerUidAlt);

		if (!teacherUser) {
			throw new Error('Teacher not found');
		}

		const newEmail = newEmailAndUsername;
		const updatedUser = await this.tspSyncService.updateUser(teacherUser, newEmail, lehrerUidNeu, lehrerUidAlt);

		const teacherAccount = await this.tspSyncService.findAccountByTspUserId(lehrerUidAlt);

		if (!teacherAccount) {
			throw new Error('Account not found');
		}

		const newUsername = newEmailAndUsername;
		const updatedAccount = await this.tspSyncService.updateAccount(teacherAccount, newUsername, systemId);

		return { updatedUser, updatedAccount };
	}
}
