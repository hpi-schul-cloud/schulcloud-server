import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ContentElementType } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';

import {
	AnyContentElement,
	BoardNodeProps,
	CollaborativeTextEditorElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	handleNonExhaustiveSwitch,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../domain';

@Injectable()
export class ContentElementCreateService {
	build(type: ContentElementType): AnyContentElement {
		let element!: AnyContentElement;

		switch (type) {
			case ContentElementType.FILE:
				element = this.buildFile();
				break;
			case ContentElementType.LINK:
				element = this.buildLink();
				break;
			case ContentElementType.RICH_TEXT:
				element = this.buildRichText();
				break;
			case ContentElementType.DRAWING:
				element = this.buildDrawing();
				break;
			case ContentElementType.SUBMISSION_CONTAINER:
				element = this.buildSubmissionContainer();
				break;
			case ContentElementType.EXTERNAL_TOOL:
				element = this.buildExternalTool();
				break;
			case ContentElementType.COLLABORATIVE_TEXT_EDITOR:
				element = this.buildCollaborativeTextEditor();
				break;
			default:
				handleNonExhaustiveSwitch(type);
		}

		return element;
	}

	boardNodeCreateProps: BoardNodeProps = {
		id: new ObjectId().toString(),
		children: [],
		level: 0,
		path: '',
		position: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	private buildFile(): FileElement {
		const element = new FileElement({
			...this.boardNodeCreateProps,
			caption: '',
			alternativeText: '',
		});

		return element;
	}

	private buildLink(): LinkElement {
		const element = new LinkElement({
			...this.boardNodeCreateProps,
			url: '',
			title: '',
		});

		return element;
	}

	private buildRichText(): RichTextElement {
		const element = new RichTextElement({
			...this.boardNodeCreateProps,
			text: '',
			inputFormat: InputFormat.RICH_TEXT_CK5,
		});

		return element;
	}

	private buildDrawing(): DrawingElement {
		const element = new DrawingElement({
			...this.boardNodeCreateProps,
			description: '',
		});

		return element;
	}

	private buildSubmissionContainer(): SubmissionContainerElement {
		const element = new SubmissionContainerElement({
			...this.boardNodeCreateProps,
			dueDate: undefined, // null, // TODO
		});

		return element;
	}

	private buildExternalTool(): ExternalToolElement {
		const element = new ExternalToolElement({
			...this.boardNodeCreateProps,
		});

		return element;
	}

	private buildCollaborativeTextEditor(): CollaborativeTextEditorElement {
		const element = new CollaborativeTextEditorElement({
			...this.boardNodeCreateProps,
		});

		return element;
	}
}
