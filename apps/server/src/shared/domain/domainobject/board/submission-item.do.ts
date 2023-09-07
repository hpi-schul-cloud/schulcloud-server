import { EntityId, InputFormat } from '@shared/domain';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class SubmissionItem extends BoardComposite<SubmissionItemProps> {
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

	get caption(): string {
		return this.props.caption;
	}

	set caption(value: string) {
		this.props.caption = value;
	}

	get text(): string {
		return this.props.text;
	}

	set text(value: string) {
		this.props.text = value;
	}

	get inputFormat(): InputFormat {
		return this.props.inputFormat;
	}

	set inputFormat(value: InputFormat) {
		this.props.inputFormat = value;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isAllowedAsChild(child: AnyBoardDo): boolean {
		// Currently submission-item rejects any children, will open in the future
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitSubmissionItem(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitSubmissionItemAsync(this);
	}
}

export interface SubmissionItemProps extends BoardCompositeProps {
	caption: string;
	inputFormat: InputFormat;
	text: string;
	completed: boolean;
	userId: EntityId;
}
