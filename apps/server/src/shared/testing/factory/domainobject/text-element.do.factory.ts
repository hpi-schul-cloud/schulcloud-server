/* istanbul ignore file */
import { Card } from '@shared/domain';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';

export const textElementFactory = Factory.define<Card>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		text: `this is my example text ${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
