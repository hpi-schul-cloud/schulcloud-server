import type { AnyMediaBoardNode } from './types';
import type { MediaLineProps } from '../types';
import { MediaExternalToolElement } from './media-external-tool-element.do';
import { BoardNode } from '../board-node.do';

export class MediaLine extends BoardNode<MediaLineProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	canHaveChild(childNode: AnyMediaBoardNode): boolean {
		const allowed: boolean = childNode instanceof MediaExternalToolElement;

		return allowed;
	}
}

// export type MediaLineInitProps = Omit<MediaLineProps, keyof BoardCompositeProps>;

// export function isMediaLine(reference: unknown): reference is MediaLine {
// return reference instanceof MediaLine;
// }
