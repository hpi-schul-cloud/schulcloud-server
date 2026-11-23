import { BoardNode } from './board-node.do';
import { CollaborativeTextEditorElement } from './collaborative-text-editor.do';
import { DeletedElement } from './deleted-element.do';
import { DrawingElement } from './drawing-element.do';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { FileFolderElement } from './file-folder-element.do';
import { H5pElement } from './h5p-element.do';
import { LinkElement } from './link-element.do';
import { RichTextElement } from './rich-text-element.do';
import { type AnyBoardNode, type CardProps } from './types';
import { Colors } from './types/colors.enum';
import { VideoConferenceElement } from './video-conference-element.do';

export class Card extends BoardNode<CardProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	get backgroundColor(): Colors {
		return this.props.backgroundColor || Colors.TRANSPARENT;
	}

	set backgroundColor(color: Colors) {
		this.props.backgroundColor = color;
	}

	get height(): number {
		return this.props.height;
	}

	set height(height: number) {
		this.props.height = height;
	}

	public canHaveChild(childNode: AnyBoardNode): boolean {
		// Using direct instanceof checks to avoid circular dependency with guards/
		return (
			childNode instanceof CollaborativeTextEditorElement ||
			childNode instanceof DrawingElement ||
			childNode instanceof ExternalToolElement ||
			childNode instanceof FileElement ||
			childNode instanceof FileFolderElement ||
			childNode instanceof LinkElement ||
			childNode instanceof RichTextElement ||
			childNode instanceof DeletedElement ||
			childNode instanceof VideoConferenceElement ||
			childNode instanceof H5pElement
		);
	}
}

export const isCard = (reference: unknown): reference is Card => reference instanceof Card;
