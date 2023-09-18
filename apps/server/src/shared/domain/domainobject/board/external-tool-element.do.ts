import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class ExternalToolElement extends BoardComposite<ExternalToolElementProps> {
	get contextExternalToolId(): string | undefined {
		return this.props.contextExternalToolId;
	}

	set contextExternalToolId(value: string | undefined) {
		this.props.contextExternalToolId = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitExternalToolElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitExternalToolElementAsync(this);
	}
}

export interface ExternalToolElementProps extends BoardCompositeProps {
	contextExternalToolId?: string;
}
