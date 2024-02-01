import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { ActivationKeyword, ActivationState } from './types';

@Entity({ tableName: 'activations', discriminatorColumn: 'keyword' })
@Index({ properties: ['userId', 'keyword'] })
export abstract class ActivationEntity extends BaseEntityWithTimestamps {
	@Index()
	@Property({ nullable: false })
	activationCode!: string;

	@Property({ nullable: true, unique: false })
	userId!: ObjectId;

	@Enum({ nullable: false })
	@Index({ options: { expireAfterSeconds: 7 * 24 * 60 * 60 } })
	keyword!: ActivationKeyword;

	@Property({ nullable: false })
	quarantinedObject!: object;

	@Property({ nullable: true })
	mailSent?: Date;

	@Enum({ nullable: true })
	state?: ActivationState = ActivationState.NOT_STARTED;

	constructor(props: ActivationProps) {
		super();
		this.activationCode = props.activationCode;
		this.userId = props.userId;
		this.keyword = props.keyword;
		this.quarantinedObject = props.quarantinedObject;
		this.mailSent = props.mailSent;
		if (props.state !== undefined) this.state = props.state;
	}
}

export interface ActivationProps {
	activationCode: string;
	userId: ObjectId;
	keyword: ActivationKeyword;
	quarantinedObject: object;
	mailSent?: Date;
	state?: ActivationState;
}
