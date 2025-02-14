import { ObjectId } from '@mikro-orm/mongodb';
import { RobjExportLehrerMigration } from '@infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportLehrerMigrationFactory = Factory.define<RobjExportLehrerMigration, RobjExportLehrerMigration>(
	() => {
		return {
			lehrerUidAlt: new ObjectId().toHexString(),
			lehrerUidNeu: new ObjectId().toHexString(),
		};
	}
);
