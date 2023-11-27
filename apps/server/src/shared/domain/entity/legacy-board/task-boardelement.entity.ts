import { Entity, ManyToOne } from '@mikro-orm/core';
import { Task } from '../task.entity';
import { BoardElement, BoardElementType } from './boardelement.entity';

@Entity({ discriminatorValue: BoardElementType.Task })
export class TaskBoardElement extends BoardElement {
	constructor(props: { target: Task }) {
		super(props);
		this.boardElementType = BoardElementType.Task;
	}

	// FIXME Due to a weird behaviour in the mikro-orm validation we have to
	// disable the validation by setting the reference nullable.
	// Remove when fixed in mikro-orm.
	@ManyToOne('Task', { nullable: true })
	target!: Task;
}
