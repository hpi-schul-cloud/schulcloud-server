import { BaseFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { County, CountyProps } from '../domain';

export const countyFactory = BaseFactory.define<County, CountyProps>(County, ({ sequence }) => {
	const county = {
		id: new ObjectId().toHexString(),
		name: `County ${sequence}`,
		countyId: sequence,
		antaresKey: `antey ${sequence}`,
	};

	return county;
});
