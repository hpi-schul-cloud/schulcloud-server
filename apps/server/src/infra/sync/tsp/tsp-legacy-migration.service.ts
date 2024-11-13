import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { Logger } from '@src/core/logger';

type LegacyTspSchoolProperties = {
	sourceOptions: {
		schoolIdentifier: number;
	};
};

const TSP_LEGACY_SYSTEM_TYPE = 'tsp-school';
const TSP_LEGACY_SOURCE_TYPE = 'tsp';
const SCHOOLS_COLLECTION = 'schools';
const SYSTEMS_COLLECTION = 'systems';

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

		const schoolIds = await this.findIdsOfLegacyTspSchools(legacySystemId);

		console.log('Number of schools', schoolIds.length);

		const promises = schoolIds.map(async (oldId): Promise<number> => {
			const filter = {
				systems: [legacySystemId],
				source: TSP_LEGACY_SOURCE_TYPE,
				sourceOptions: {
					schoolIdentifier: oldId,
				},
			};

			const featureUpdateCount = await this.em.nativeUpdate(SCHOOLS_COLLECTION, filter, {
				$addToSet: {
					features: SchoolFeature.OAUTH_PROVISIONING_ENABLED,
				},
			});
			const idUpdateCount = await this.em.nativeUpdate(SCHOOLS_COLLECTION, filter, {
				ldapSchoolIdentifier: oldId,
				systems: [new ObjectId(newSystemId)],
			});

			return featureUpdateCount === 1 && idUpdateCount === 1 ? 1 : 0;
		});

		const res = await Promise.allSettled(promises);
		const success = res
			.filter((r) => r.status === 'fulfilled')
			.map((r) => r.value)
			.reduce((acc, c) => acc + c, 0);
		console.log(`Migrated ${schoolIds.length} legacy schools to new system. ${success} succeeded.`);
	}

	private async findLegacySystemId() {
		const tspLegacySystem = await this.em.getCollection(SYSTEMS_COLLECTION).findOne({
			type: TSP_LEGACY_SYSTEM_TYPE,
		});

		return tspLegacySystem?._id;
	}

	private async findIdsOfLegacyTspSchools(legacySystemId: ObjectId) {
		const schools = await this.em
			.getCollection<LegacyTspSchoolProperties>(SCHOOLS_COLLECTION)
			.find({
				systems: [legacySystemId],
				source: TSP_LEGACY_SOURCE_TYPE,
			})
			.toArray();

		const schoolIds = schools.map((school) => school.sourceOptions.schoolIdentifier);

		return schoolIds;
	}
}
