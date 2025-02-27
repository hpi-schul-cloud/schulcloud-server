import { ObjectId } from '@mikro-orm/mongodb';
import { RobjExportSchueler } from '@infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportSchuelerFactory = Factory.define<RobjExportSchueler, RobjExportSchueler>(({ sequence }) => {
	return {
		schuelerUid: new ObjectId().toHexString(),
		schuelerVorname: `schuelerVorname ${sequence}`,
		schuelerNachname: `schuelerNachname ${sequence}`,
		schuleNummer: `schuleNummer ${sequence}`,
		klasseId: `klasseId ${sequence}`,
	};
});
