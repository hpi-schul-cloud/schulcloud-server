import { SchoolExternalToolRefDO } from '@shared/domain/domainobject/tool';
import { BaseFactory } from '../../base.factory';

export const SchoolExternalToolRefFactory = BaseFactory.define<SchoolExternalToolRefDO, SchoolExternalToolRefDO>(
	SchoolExternalToolRefDO,
	({ sequence }) => {
		return {
			schoolToolId: `schoolToolId-${sequence}`,
			schoolId: `schoolId-${sequence}`,
		};
	}
);
