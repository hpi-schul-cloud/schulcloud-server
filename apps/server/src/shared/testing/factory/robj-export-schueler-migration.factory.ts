import { ObjectId } from '@mikro-orm/mongodb';
import { RobjExportSchuelerMigration } from '@src/infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportSchuelerMigrationFactory = Factory.define<
	RobjExportSchuelerMigration,
	RobjExportSchuelerMigration
>(() => {
	return {
		schuelerUidAlt: new ObjectId().toHexString(),
		schuelerUidNeu: new ObjectId().toHexString(),
	};
});
