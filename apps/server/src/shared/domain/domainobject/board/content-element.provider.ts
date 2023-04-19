import { Injectable, NotImplementedException } from '@nestjs/common';
import { ObjectId } from 'bson';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import { AnyContentElementDo } from './types/any-content-element-do';
import { ContentElementType } from './types/content-elements.enum';

@Injectable()
export class ContentElementProvider {
	private elements = new Map<ContentElementType, AnyContentElementDo>();

	constructor() {
		this.elements.set(
			ContentElementType.TEXT,
			new TextElement({
				id: new ObjectId().toHexString(),
				text: ``,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		);
		this.elements.set(
			ContentElementType.FILE,
			new FileElement({
				id: new ObjectId().toHexString(),
				caption: ``,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		);
	}

	getElement(type: ContentElementType): AnyContentElementDo {
		const element = this.elements.get(type);

		if (!element) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return element;
	}
}
