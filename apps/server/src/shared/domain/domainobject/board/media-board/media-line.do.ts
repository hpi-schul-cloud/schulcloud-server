import { BoardComposite, BoardCompositeProps } from '../board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from '../types';
import { MediaExternalToolElement } from './media-external-tool-element.do';

export class MediaLine extends BoardComposite<MediaLineProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed: boolean = domainObject instanceof MediaExternalToolElement;

		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitMediaLine(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitMediaLineAsync(this);
	}
}

export interface MediaLineProps extends BoardCompositeProps {
	title: string;
}

export type MediaLineInitProps = Omit<MediaLineProps, keyof BoardCompositeProps>;

export function isMediaLine(reference: unknown): reference is MediaLine {
	return reference instanceof MediaLine;
}