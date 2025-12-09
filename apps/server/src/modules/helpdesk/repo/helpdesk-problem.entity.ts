import { Entity, Enum, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { HelpdeskProblemState } from '../domain/type';

export interface HelpdeskProblemEntityProps {
	id?: EntityId;
	subject: string;
	currentState?: string;
	targetState?: string;
	state: HelpdeskProblemState;
	notes?: string;
	order?: number;
	userId?: EntityId;
	schoolId: EntityId;
	forwardedAt?: Date;
}

@Entity({ tableName: 'problems' })
export class HelpdeskProblemEntity extends BaseEntityWithTimestamps {
	@Property()
	subject: string;

	@Property({ nullable: true })
	currentState?: string;

	@Property({ nullable: true })
	targetState?: string;

	@Enum()
	state: HelpdeskProblemState;

	@Property({ nullable: true })
	notes?: string;

	@Property({ nullable: true })
	order?: number;

	@Property({ nullable: true })
	userId?: EntityId;

	@Property()
	schoolId: EntityId;

	@Property({ nullable: true })
	forwardedAt?: Date;

	constructor(props: HelpdeskProblemEntityProps) {
		super();
		this.subject = props.subject;
		this.currentState = props.currentState;
		this.targetState = props.targetState;
		this.state = props.state;
		this.notes = props.notes;
		this.order = props.order || 0;
		this.userId = props.userId;
		this.schoolId = props.schoolId;
		this.forwardedAt = props.forwardedAt;
	}
}
