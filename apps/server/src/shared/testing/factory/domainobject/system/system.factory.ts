import { ObjectId } from '@mikro-orm/mongodb';
import { System, SystemProps } from '@modules/system/domain';
import { DomainObjectFactory } from '../domain-object.factory';

export const systemFactory = DomainObjectFactory.define<System, SystemProps>(System, () => {
	return {
		id: new ObjectId().toHexString(),
		type: 'oauth2',
	};
});
