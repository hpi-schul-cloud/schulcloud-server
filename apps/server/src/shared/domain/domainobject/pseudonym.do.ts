import { EntityId } from '../types';
import { BaseDO } from './base.do';

export class PseudonymDO extends BaseDO {
	createdAt?: Date;

	updatedAt?: Date;

	pseudonym: string;

	toolId: EntityId;

	userId: EntityId;

	constructor(props: PseudonymDO) {
		super(props.id);

		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
