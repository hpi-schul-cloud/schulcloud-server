import { Pseudonym, PseudonymProps } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from './do-base.factory';

export const pseudonymFactory = DoBaseFactory.define<Pseudonym, PseudonymProps>(Pseudonym, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		pseudonym: `pseudonym${sequence}`,
		toolId: 'toolId',
		userId: 'userId',
	};
});
