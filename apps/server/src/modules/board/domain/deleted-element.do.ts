import { BoardNode } from './board-node.do';
import type { ContentElementType, DeletedElementProps } from './types';

export class DeletedElement extends BoardNode<DeletedElementProps> {
	get title(): string {
		return this.props.title;
	}

	set title(value: string) {
		this.props.title = value;
	}

	get deletedElementType(): ContentElementType {
		return this.props.deletedElementType;
	}

	set deletedElementType(value: ContentElementType) {
		this.props.deletedElementType = value;
	}

	get description(): string | undefined {
		return this.props.description;
	}

	set description(value: string) {
		this.props.description = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isDeletedElement = (reference: unknown): reference is DeletedElement =>
	reference instanceof DeletedElement;
