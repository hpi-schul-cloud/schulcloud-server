import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

export class UserLoginMigrationDO extends BaseDO {
	public schoolId: EntityId;

	public sourceSystemId?: EntityId;

	public targetSystemId: EntityId;

	public mandatorySince?: Date;

	public startedAt: Date;

	public closedAt?: Date;

	public finishedAt?: Date;

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
