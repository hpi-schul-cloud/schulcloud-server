import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';

@Injectable()
export class TspLegacyMigrationService {
	constructor(private readonly em: EntityManager, private readonly logger: Logger) {
		logger.setContext(TspLegacyMigrationService.name);
	}

	public async migrateLegacyData(newSystemId: EntityId): Promise<void> {
		console.log('starting legacy migration');
		const legacySystemId = await this.findLegacySystemId();

		if (!legacySystemId) {
			console.log('No legacy system found');
			return;
		}

		const schools = await this.em.find<
			SchoolProperties & {
				sourceOptions: {
					schoolIdentifier: number;
				};
			}
		>('schools', {
			systems: [legacySystemId],
			source: 'tsp',
		});

		const schoolIds = schools.map((school) => school.sourceOptions.schoolIdentifier);

		console.log('Number of schools', schoolIds);

		const promises = schoolIds.map((oldId) =>
			this.em.nativeUpdate(
				'schools',
				{
					systems: [legacySystemId],
					source: 'tsp',
				},
				{
					$unset: { sourceOptions: '' },
					ldapSchoolIdentifier: oldId,
					systems: [new ObjectId(newSystemId)],
				}
			)
		);

		const res = await Promise.allSettled(promises);
		const success = res.map((r) => r.status === 'fulfilled').length;
		console.log(`Migrated ${schoolIds.length} legacy schools to new system. ${success} succeeded.`);
	}

	private async findLegacySystemId() {
		const tspLegacySystem = await this.em.getCollection('systems').findOne({
			type: 'tsp-school',
		});

		return tspLegacySystem?._id;
	}
}
