import { PseudonymDO } from '@shared/domain';
import { DoBaseFactory } from './do-base.factory';

export const pseudonymDOFactory = DoBaseFactory.define<PseudonymDO, PseudonymDO>(PseudonymDO, ({ sequence }) => {
	return {
		pseudonym: `pseudonym${sequence}`,
		toolId: 'toolId',
		userId: 'userId',
	};
});
