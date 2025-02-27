import { RobjExportSchule } from '@infra/tsp-client';
import { Factory } from 'fishery';

export const robjExportSchuleFactory = Factory.define<RobjExportSchule, RobjExportSchule>(({ sequence }) => {
	return {
		schuleName: `schuleName ${sequence}`,
		schuleNummer: `schuleNummer ${sequence}`,
	};
});
