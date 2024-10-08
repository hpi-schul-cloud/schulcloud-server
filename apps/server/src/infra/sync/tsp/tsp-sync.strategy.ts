import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { System } from '@src/modules/system';
import pLimit from 'p-limit';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { TspSyncService } from './tsp-sync.service';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	private readonly schoolLimit: pLimit.Limit;

	constructor(private readonly tspSyncService: TspSyncService) {
		super();
		this.schoolLimit = pLimit(Configuration.get('TSP_SYNC_SCHOOL_LIMIT') as number);
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

		const schoolPromises = tspSchools.map((school) =>
			this.schoolLimit(async () => {
				const existingSchool = await this.tspSyncService.findSchool(system, school.schuleNummer ?? '');

				if (existingSchool) {
					const updatedSchool = await this.tspSyncService.updateSchool(existingSchool, school.schuleName ?? '');
					return updatedSchool;
				}

				const createdSchool = await this.tspSyncService.createSchool(
					system,
					school.schuleNummer ?? '',
					school.schuleName ?? ''
				);
				return createdSchool;
			})
		);

		const scSchools = await Promise.all(schoolPromises);
		return scSchools;
	}
}
