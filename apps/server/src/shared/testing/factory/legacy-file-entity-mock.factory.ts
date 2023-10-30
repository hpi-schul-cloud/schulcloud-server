import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';

export const legacyFileEntityMockFactory = Factory.define<{ id: string; name: string }>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `file-${sequence}.jpg`,
	};
});
