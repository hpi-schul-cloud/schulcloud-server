import { Entity, ManyToOne } from '@mikro-orm/core';
import { Task } from '../task.entity';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-boardelement.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.Task })
export class TaskBoardElement extends LegacyBoardElement {
	constructor(props: { target: Task }) {
		super();
		this.boardElementType = LegacyBoardElementType.Task;
		this._target = props.target;
	}

	// FIXME Due to a weird behaviour in the mikro-orm validation we have to
	// disable the validation by setting the reference nullable.
	// Remove when fixed in mikro-orm.
	// @ManyToOne({ entity: 'Task', fieldName: 'target', nullable: true })
	@ManyToOne({ entity: 'Task', fieldName: 'target' })
	_target!: Task;

	get target() {
		return this._target;
	}
}
