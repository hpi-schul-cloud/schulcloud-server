import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';
import { SubmissionSubElement } from './submission-subelment.do';

export class TaskElement extends BoardComposite<TaskElementProps> {
	get dueDate(): Date {
		return this.props.dueDate;
	}

	set dueDate(value: Date) {
		this.props.dueDate = value;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof SubmissionSubElement;
		return allowed;
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
