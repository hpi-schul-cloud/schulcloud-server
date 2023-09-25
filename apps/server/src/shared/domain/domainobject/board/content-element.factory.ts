import { Injectable, NotImplementedException } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import { AnyContentElementDo, ContentElementType } from './types';

@Injectable()
export class ContentElementFactory {
	build(type: ContentElementType): AnyContentElementDo {
		let element!: AnyContentElementDo;

		switch (type) {
			case ContentElementType.FILE:
				element = this.buildFile();
				break;
			case ContentElementType.RICH_TEXT:
				element = this.buildRichText();
				break;
			case ContentElementType.SUBMISSION_CONTAINER:
				element = this.buildSubmissionContainer();
				break;
			case ContentElementType.EXTERNAL_TOOL:
				element = this.buildExternalTool();
				break;
			default:
				break;
		}

		if (!element) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return element;
	}

	private buildFile() {
		const element = new FileElement({
			id: new ObjectId().toHexString(),
			caption: '',
			alternativeText: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return element;
	}

	private buildRichText() {
		const element = new RichTextElement({
			id: new ObjectId().toHexString(),
			text: '',
			inputFormat: InputFormat.RICH_TEXT_CK5,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return element;
	}

	private buildSubmissionContainer() {
		const tomorrow = new Date(Date.now() + 86400000);
		const element = new SubmissionContainerElement({
			id: new ObjectId().toHexString(),
			dueDate: tomorrow,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return element;
	}

	private buildExternalTool() {
		const element = new ExternalToolElement({
			id: new ObjectId().toHexString(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return element;
	}
}
