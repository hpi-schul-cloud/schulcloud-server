import { Card } from '@shared/domain';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';

export const cardFactory = Factory.define<Card>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `card #${sequence}`,
		height: 150,
		elements: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
