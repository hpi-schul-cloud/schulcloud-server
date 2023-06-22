import { Injectable, NotImplementedException } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { FileElement } from './file-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import { AnyContentElementDo } from './types/any-content-element-do';
import { ContentElementType } from './types/content-elements.enum';

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
				element = this.buildTask();
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

	private buildTask() {
		const element = new SubmissionContainerElement({
			id: new ObjectId().toHexString(),
			dueDate: new Date(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return element;
	}
}
