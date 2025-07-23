import { ObjectId } from '@mikro-orm/mongodb';
import { RobjExportLehrer } from '@infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportLehrerFactory = Factory.define<RobjExportLehrer, RobjExportLehrer>(({ sequence }) => {
	return {
		lehrerUid: new ObjectId().toHexString(),
		lehrerTitel: `lehrerTitel ${sequence}`,
		lehrerVorname: `lehrerVorname ${sequence}`,
		lehrerNachname: `lehrerNachname ${sequence}`,
		schuleNummer: `schuleNummer ${sequence}`,
	};
});
