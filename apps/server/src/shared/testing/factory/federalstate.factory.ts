import { FederalState, IFederalStateProperties } from '@shared/domain/entity/federalstate.entity';
import { BaseFactory } from './base.factory';

export const federalStateFactory = BaseFactory.define<FederalState, IFederalStateProperties>(FederalState, () => {
	const name = `Default state`;
	const logoUrl = ``;
	const abbreviation = `DP`;
	const counties = [];
	return { name, logoUrl, abbreviation, counties };
});
