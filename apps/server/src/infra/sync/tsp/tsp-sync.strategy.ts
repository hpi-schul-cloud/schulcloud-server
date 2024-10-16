import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSchulnummerMissingLoggable } from './loggable/tsp-schulnummer-missing.loggable';
import { TspSyncConfig } from './tsp-sync.config';
import { TspSyncService } from './tsp-sync.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: pLimit.Limit;

	private readonly schoolDaysToFetch: number;

	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		configService: ConfigService<TspSyncConfig, true>
	) {
		super();
		this.logger.setContext(TspSyncStrategy.name);
		this.schoolLimit = pLimit(configService.getOrThrow<number>('TSP_SYNC_SCHOOL_LIMIT'));
		this.schoolDaysToFetch = configService.get<number>('TSP_SYNC_SCHOOL_DAYS_TO_FETCH', 1);
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	public async sync(): Promise<void> {
		const system = await this.tspSyncService.findTspSystemOrFail();

		await this.syncSchools(system);
	}

	private async syncSchools(system: System): Promise<School[]> {
		const tspSchools = await this.tspSyncService.fetchTspSchools(system, this.schoolDaysToFetch);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length, this.schoolDaysToFetch));

		const schoolPromises = tspSchools.map((tspSchool) =>
			this.schoolLimit(async () => {
				if (!tspSchool.schuleNummer) {
					this.logger.warning(new TspSchulnummerMissingLoggable());
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
}
