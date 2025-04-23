import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { type EntityId, InputFormat } from '@shared/domain/types';
import { Card } from './card.do';
import { CollaborativeTextEditorElement } from './collaborative-text-editor.do';
import { ColumnBoard } from './colum-board.do';
import { Column } from './column.do';
import { DrawingElement } from './drawing-element.do';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { FileFolderElement } from './file-folder-element.do';
import { H5pElement } from './h5p-element.do';
import { LinkElement } from './link-element.do';
import { ROOT_PATH } from './path-utils';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import { SubmissionItem } from './submission-item.do';
import { handleNonExhaustiveSwitch } from './type-mapping';
import type { AnyContentElement, BoardExternalReference, BoardLayout, BoardNodeProps } from './types';
import { ContentElementType } from './types';
import { VideoConferenceElement } from './video-conference-element.do';

@Injectable()
export class BoardNodeFactory {
	public buildColumnBoard(props: { context: BoardExternalReference; title: string; layout: BoardLayout }): ColumnBoard {
		const columnBoard = new ColumnBoard({ ...this.getBaseProps(), isVisible: false, ...props });

		return columnBoard;
	}

	public buildColumn(): Column {
		const column = new Column({ ...this.getBaseProps() });

		return column;
	}

	public buildCard(children: AnyContentElement[] = []): Card {
		// TODO right way to specify default card height?
		const card = new Card({ ...this.getBaseProps(), height: 150, children });

		return card;
	}

	public buildContentElement(type: ContentElementType): AnyContentElement {
		let element!: AnyContentElement;

		switch (type) {
			case ContentElementType.FILE:
				element = new FileElement({
					...this.getBaseProps(),
					caption: '',
					alternativeText: '',
				});
				break;
			case ContentElementType.FILE_FOLDER:
				element = new FileFolderElement({
					...this.getBaseProps(),
					title: '',
				});
				break;
			case ContentElementType.LINK:
				element = new LinkElement({
					...this.getBaseProps(),
					url: '',
					title: '',
				});
				break;
			case ContentElementType.RICH_TEXT:
				element = new RichTextElement({
					...this.getBaseProps(),
					text: '',
					inputFormat: InputFormat.RICH_TEXT_CK5,
				});
				break;
			case ContentElementType.DRAWING:
				element = new DrawingElement({
					...this.getBaseProps(),
					description: '',
				});
				break;
			case ContentElementType.SUBMISSION_CONTAINER:
				element = new SubmissionContainerElement({
					...this.getBaseProps(),
					dueDate: undefined,
				});
				break;
			case ContentElementType.EXTERNAL_TOOL:
				element = new ExternalToolElement({
					...this.getBaseProps(),
				});
				break;
			case ContentElementType.DELETED:
				throw new UnprocessableEntityException('Deleted elements cannot be created from the outside');
			case ContentElementType.COLLABORATIVE_TEXT_EDITOR:
				element = new CollaborativeTextEditorElement({
					...this.getBaseProps(),
				});
				break;
			case ContentElementType.VIDEO_CONFERENCE:
				element = new VideoConferenceElement({
					...this.getBaseProps(),
					title: '',
				});
				break;
			case ContentElementType.H5P:
				element = new H5pElement({
					...this.getBaseProps(),
				});
				break;
			default:
				handleNonExhaustiveSwitch(type);
		}

		if (!element) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return element;
	}

	public buildSubmissionItem(props: { completed: boolean; userId: EntityId }): SubmissionItem {
		const submissionItem = new SubmissionItem({ ...this.getBaseProps(), ...props });

		return submissionItem;
	}

	private getBaseProps(): BoardNodeProps {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
