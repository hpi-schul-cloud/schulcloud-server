import { EntityId } from '@shared/domain';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class SubmissionBoard extends BoardComposite<SubmissionBoardProps> {
	get completed(): boolean {
		return this.props.completed;
	}

	set completed(value: boolean) {
		this.props.completed = value;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	set userId(value: EntityId) {
		this.props.userId = value;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isAllowedAsChild(child: AnyBoardDo): boolean {
		return true;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitSubmission(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitSubmissionAsync(this);
	}
}

export interface SubmissionBoardProps extends BoardCompositeProps {
	completed: boolean;
	userId: EntityId;
}
