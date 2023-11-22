import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class LearnstoreElement extends BoardComposite<LearnstoreElementProps> {
	get someId(): string | undefined {
		return this.props.someId;
	}

	set someId(value: string | undefined) {
		this.props.someId = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitLearnstoreElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitLearnstoreElementAsync(this);
	}
}

export interface LearnstoreElementProps extends BoardCompositeProps {
	someId?: string;
}
