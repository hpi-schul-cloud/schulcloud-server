import { Entity, IdentifiedReference, ManyToOne, Property, Reference } from '@mikro-orm/core';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';

export type OperationStatusProps = {
	title: string;
	originalId?: EntityId;
	status: OperationStatusEnum;
};

export enum OperationStatusEnum {
	STARTED = 'started',
	SUCCESSFUL = 'successful',
	FAILED = 'failed',
}

@Entity()
export class OperationStatus extends BaseEntityWithTimestamps {
	constructor(props: OperationStatusProps) {
		super();
		this.title = props.title;
		this.status = props.status;
		if (props.originalId) this.original = Reference.createFromPK(OperationStatus, props.originalId);
	}

	@Property()
	title: string;

	@ManyToOne('OperationStatus', { nullable: true })
	original?: IdentifiedReference<OperationStatus>;

	@Property()
	status: OperationStatusEnum;
}
