import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { TspLegacyMigrationStartLoggable } from './loggable/tsp-legacy-migration-start.loggable';
import { TspLegacyMigrationSystemMissingLoggable } from './loggable/tsp-legacy-migration-system-missing.loggable';
import { TspLegacySchoolMigrationCountLoggable } from './loggable/tsp-legacy-school-migration-count.loggable';
import { TspLegacySchoolMigrationSuccessLoggable } from './loggable/tsp-legacy-school-migration-success.loggable';

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
		this.logger.info(new TspLegacyMigrationStartLoggable());

		const legacySystemId = await this.findLegacySystemId();

		if (!legacySystemId) {
			this.logger.info(new TspLegacyMigrationSystemMissingLoggable());
			return;
		}

		const schoolIds = await this.findIdsOfLegacyTspSchools(legacySystemId);

		this.logger.info(new TspLegacySchoolMigrationCountLoggable(schoolIds.length));

		const promises = schoolIds.map(async (oldId): Promise<number> => {
			const legacySchoolFilter = {
				systems: [legacySystemId],
				source: TSP_LEGACY_SOURCE_TYPE,
				sourceOptions: {
					schoolIdentifier: oldId,
				},
			};

			const featureUpdateCount = await this.em.nativeUpdate(SCHOOLS_COLLECTION, legacySchoolFilter, {
				$addToSet: {
					features: SchoolFeature.OAUTH_PROVISIONING_ENABLED,
				},
			});
			const idUpdateCount = await this.em.nativeUpdate(SCHOOLS_COLLECTION, legacySchoolFilter, {
				ldapSchoolIdentifier: oldId,
				systems: [new ObjectId(newSystemId)],
			});

			return featureUpdateCount === 1 && idUpdateCount === 1 ? 1 : 0;
		});

		const results = await Promise.allSettled(promises);
		const successfulMigrations = results
			.filter((r) => r.status === 'fulfilled')
			.map((r) => r.value)
			.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

		this.logger.info(new TspLegacySchoolMigrationSuccessLoggable(schoolIds.length, successfulMigrations));
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
