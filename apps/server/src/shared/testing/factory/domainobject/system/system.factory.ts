import { ObjectId } from '@mikro-orm/mongodb';
import { System, SystemProps } from '@modules/system/domain';
import { SystemType } from '@shared/domain/types';
import { DomainObjectFactory } from '../domain-object.factory';

export const systemFactory = DomainObjectFactory.define<System, SystemProps>(System, () => {
	return {
		id: new ObjectId().toHexString(),
		type: SystemType.OAUTH,
	};
});
