import { Factory } from 'fishery';
import { ObjectId } from '@mikro-orm/mongodb';

export const legacyFileEntityMockFactory = Factory.define<{ id: string; name: string }>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `file-${sequence}.jpg`,
	};
});
