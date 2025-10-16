import { ObjectId } from '@mikro-orm/mongodb';
import { RobjExportKlasse } from '@infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportKlasseFactory = Factory.define<RobjExportKlasse, RobjExportKlasse>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		version: `version ${sequence}`,
		klasseName: `klasseName ${sequence}`,
		schuleNummer: `schuleNummer ${sequence}`,
		klasseId: `klasseId ${sequence}`,
		lehrerUid: `lehrerUid ${sequence}`,
	};
});
