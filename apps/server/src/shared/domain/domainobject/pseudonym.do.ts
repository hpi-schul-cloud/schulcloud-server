import { EntityId } from '../types';
import { BaseWithTimestampsDO } from './base.do';

export class PseudonymDO extends BaseWithTimestampsDO {
	pseudonym: string;

	toolId: EntityId;

	userId: EntityId;

	constructor(props: PseudonymDO) {
		super(props);
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
