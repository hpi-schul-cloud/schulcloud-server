import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
import { TspSyncConfig } from './tsp-sync.config';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSchoolsFetchedLoggable } from './loggable/tsp-schools-fetched.loggable';
import { TspSchoolsSyncedLoggable } from './loggable/tsp-schools-synced.loggable';
import { TspSyncService } from './tsp-sync.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: pLimit.Limit;

	constructor(
		private readonly logger: Logger,
		private readonly tspSyncService: TspSyncService,
		configService: ConfigService<TspSyncConfig, true>
	) {
		super();
		this.logger.setContext(TspSyncStrategy.name);
		this.schoolLimit = pLimit(configService.getOrThrow<number>('TSP_SYNC_SCHOOL_LIMIT'));
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	public async sync(): Promise<void> {
		const system = await this.tspSyncService.findTspSystemOrFail();

		await this.syncSchools(system);
	}

	private async syncSchools(system: System): Promise<School[]> {
		const tspSchools = await this.tspSyncService.fetchTspSchools(system);
		this.logger.info(new TspSchoolsFetchedLoggable(tspSchools.length));

		const schoolPromises = tspSchools.map((tspSchool) =>
			this.schoolLimit(async () => {
				const existingSchool = await this.tspSyncService.findSchool(system, tspSchool.schuleNummer ?? '');

				if (existingSchool) {
					const updatedSchool = await this.tspSyncService.updateSchool(existingSchool, tspSchool.schuleName ?? '');
					return { school: updatedSchool, created: false };
				}

				const createdSchool = await this.tspSyncService.createSchool(
					system,
					tspSchool.schuleNummer ?? '',
					tspSchool.schuleName ?? ''
				);
				return { school: createdSchool, created: true };
			})
		);

		const scSchools = await Promise.all(schoolPromises);

		const total = scSchools.length;
		const createdSchools = scSchools.filter((scSchool) => scSchool.created).length;
		const updatedSchools = total - createdSchools;
		this.logger.info(new TspSchoolsSyncedLoggable(total, createdSchools, updatedSchools));

		return scSchools.map((scSchool) => scSchool.school);
	}
}
