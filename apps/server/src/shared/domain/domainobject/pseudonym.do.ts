import { EntityId } from '@shared/domain/types';
import { BaseDO } from './base.do';

export class PseudonymDO extends BaseDO {
	pseudonym: string;

	toolId: EntityId;

	userId: EntityId;

	constructor(domainObject: PseudonymDO) {
		super(domainObject.id);

		this.pseudonym = domainObject.pseudonym;
		this.toolId = domainObject.toolId;
		this.userId = domainObject.userId;
	}
}
