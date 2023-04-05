import { BaseDO } from './base.do';

export class UserLoginMigrationDO extends BaseDO {
	sourceSystemId: string;

	targetSystemId: string;

	mandatorySince?: Date;

	// TODO: N21-822 make required when real entity is there
	startedAt?: Date;

	completedAt?: Date;

	finishedAt?: Date;

	constructor(props: UserLoginMigrationDO) {
		super(props.id);
		this.sourceSystemId = props.sourceSystemId;
		this.targetSystemId = props.targetSystemId;
		this.mandatorySince = props.mandatorySince;
		this.startedAt = props.startedAt;
		this.completedAt = props.completedAt;
		this.finishedAt = props.finishedAt;
	}
}
