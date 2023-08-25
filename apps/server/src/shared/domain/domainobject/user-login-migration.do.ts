import { EntityId } from '../types';
import { BaseDO } from './base.do';

export class UserLoginMigrationDO extends BaseDO {
	schoolId: EntityId;

	sourceSystemId?: EntityId;

	targetSystemId: EntityId;

	mandatorySince?: Date;

	startedAt?: Date;

	closedAt?: Date;

	finishedAt?: Date;

	constructor(props: UserLoginMigrationDO) {
		super(props.id);
		this.schoolId = props.schoolId;
		this.sourceSystemId = props.sourceSystemId;
		this.targetSystemId = props.targetSystemId;
		this.mandatorySince = props.mandatorySince;
		this.startedAt = props.startedAt;
		this.closedAt = props.closedAt;
		this.finishedAt = props.finishedAt;
	}
}
