import { BaseDO } from './base.do';
import { EntityId } from '@shared/domain/types';

export class PseudonymDO extends BaseDO {
	createdAt?: Date;

	updatedAt?: Date;

	pseudonym: string;

	toolId: EntityId;

	userId: EntityId;

	constructor(domainObject: PseudonymDO) {
		super(domainObject.id);

		this.createdAt = domainObject.createdAt;
		this.updatedAt = domainObject.updatedAt;
		this.pseudonym = domainObject.pseudonym;
		this.toolId = domainObject.toolId;
		this.userId = domainObject.userId;
	}
}
