import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class FileElement extends BoardComposite<FileElementProps> {
	get caption(): string | undefined {
		return this.props.caption;
	}

	set caption(value: string | undefined) {
		this.props.caption = value;
	}

	get alternativeText(): string | undefined {
		return this.props.alternativeText;
	}

	set alternativeText(value: string | undefined) {
		this.props.alternativeText = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitFileElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitFileElementAsync(this);
	}
}

export interface FileElementProps extends BoardCompositeProps {
	caption?: string;
	alternativeText?: string;
}
