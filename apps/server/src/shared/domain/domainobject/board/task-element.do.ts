import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class TaskElement extends BoardComposite<TaskElementProps> {
	get dueDate(): Date {
		return this.props.dueDate;
	}

	set dueDate(value: Date) {
		this.props.dueDate = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitTaskElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitTaskElementAsync(this);
	}
}

export interface TaskElementProps extends BoardCompositeProps {
	dueDate: Date;
}
