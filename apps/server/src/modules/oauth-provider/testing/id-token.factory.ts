import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { IdToken } from '../domain/interface';

export const idTokenFactory = Factory.define<IdToken>(() => {
	return {
		schoolId: new ObjectId().toHexString(),
	};
});
