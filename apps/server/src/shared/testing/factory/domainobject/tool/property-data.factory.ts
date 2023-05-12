import { PropertyDataDO, PropertyLocation } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const propertyDataDOFactory = BaseFactory.define<PropertyDataDO, PropertyDataDO>(
	PropertyDataDO,
	({ sequence }) => {
		return {
			name: `propertyName${sequence}`,
			value: `value${sequence}`,
			location: PropertyLocation.BODY,
		};
	}
);
