import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSourceOptions } from '@shared/domain/domainobject/user-source-options.do';
import { Loggable, Logger } from '@src/core/logger';
import { Account, AccountService } from '@src/modules/account';
import { ProvisioningService } from '@src/modules/provisioning';
import { System } from '@src/modules/system';
import { UserService } from '@src/modules/user';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspDataFetchedLoggable } from './loggable/tsp-data-fetched.loggable';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncedUsersLoggable } from './loggable/tsp-synced-users.loggable';
import { TspSyncingUsersLoggable } from './loggable/tsp-syncing-users.loggable';
import { TspTeachersFetchedLoggable } from './loggable/tsp-teachers-fetched.loggable';
import { TspUsersMigratedLoggable } from './loggable/tsp-users-migrated.loggable';
import { TspFetchService } from './tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp-oauth-data.mapper';
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
		private readonly provisioningService: ProvisioningService,
		private readonly userService: UserService,
		private readonly accountService: AccountService
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

		if (this.configService.get<boolean>('FEATURE_TSP_MIGRATION_ENABLED', false)) {
			await this.runMigration(system);
		}

		await this.syncData(system, schools);
	}

	private async syncSchools(system: System): Promise<School[]> {
		const schoolDaysToFetch = this.configService.get<number>('TSP_SYNC_SCHOOL_LIMIT', 1);
		const tspSchools = await this.tspFetchService.fetchTspSchools(system, schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, schoolDaysToFetch));

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
		const schoolDataDaysToFetch = this.configService.get<number>('TSP_SYNC_SCHOOL_DAYS_TO_FETCH', 1);
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

		const dataPromises = oauthDataDtos.map((oauthDataDto) => this.provisioningService.provisionData(oauthDataDto));

		const results = await Promise.allSettled(dataPromises);

		this.logger.info(new TspSyncedUsersLoggable(results.length));
	}

	private async migrateTspTeachersBatch(system: System, oldToNewMappings: Map<string, string>): Promise<number> {
		this.logger.info(new TspTeachersFetchedLoggable(oldToNewMappings.size));

		const oldIds = Array.from(oldToNewMappings.keys());
		const batchSize = this.configService.get<number>('TSP_SYNC_MIGRATION_LIMIT', 100);

		const batchCount = Math.ceil(oldIds.length / batchSize);
		const batches: string[][] = [];
		for (let i = 0; i < batchCount; i += 1) {
			const start = i * batchSize;
			const end = Math.min((i + 1) * batchSize, oldIds.length);
			batches.push(oldIds.slice(start, end));
		}

		let total = 0;
		for await (const oldIdsBatch of batches) {
			this.logger.info(this.logForMsg('Start of new batch'));

			const users = await this.userService.findByTspUids(oldIdsBatch);
			this.logger.info(this.logForMsg(`Users fetched: ${users.length}`));

			const userIds = users.map((user) => user.id ?? '');
			const accounts = await this.accountService.findMultipleByUserId(userIds);
			this.logger.info(this.logForMsg(`Accounts loaded: ${accounts.length}`));

			const accountsForUserid = new Map<string, Account>();
			accounts.forEach((account) => accountsForUserid.set(account.userId ?? '', account));

			users.forEach((user) => {
				const newUid = oldToNewMappings.get(user.sourceOptions?.tspUid ?? '') ?? '';
				const newEmailAndUsername = `${newUid}@schul-cloud.org`;

				user.email = newEmailAndUsername;
				user.externalId = newUid;
				user.previousExternalId = user.sourceOptions?.tspUid;
				user.sourceOptions = new UserSourceOptions({ tspUid: newUid });

				const account = accountsForUserid.get(user.id ?? '');
				if (account) {
					account.username = newEmailAndUsername;
					account.systemId = system.id;
				}
			});

			await this.userService.saveAll(users);
			this.logger.info(this.logForMsg('Users saved'));

			await this.accountService.saveAll(accounts);
			this.logger.info(this.logForMsg('Accounts saved'));

			total += users.length;
			this.logger.info(this.logForMsg(`Users so far ${total}`));
		}

		return total;
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

		const migrationResult = await this.migrateTspTeachersBatch(system, oldToNewMappings);
		this.logger.info(new TspUsersMigratedLoggable(migrationResult));
	}

	private logForMsg(msg: string): Loggable {
		return {
			getLogMessage() {
				return {
					message: msg,
				};
			},
		};
	}
}
