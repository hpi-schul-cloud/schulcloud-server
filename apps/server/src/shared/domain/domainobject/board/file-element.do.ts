import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class FileElement extends BoardComposite<FileElementProps> {
	get caption(): string {
		return this.props.caption;
	}

	set caption(value: string) {
		this.props.caption = value;
	}

	get fileName(): string {
		return this.props.fileName;
	}

	set fileName(value: string) {
		this.props.fileName = value;
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
	caption: string;
	fileName: string;
}
