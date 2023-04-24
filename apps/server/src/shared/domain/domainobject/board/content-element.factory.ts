import { Injectable, NotImplementedException } from '@nestjs/common';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import { AnyContentElementDo } from './types/any-content-element-do';
import { ContentElementType } from './types/content-elements.enum';

@Injectable()
export class ContentElementFactory {
	private elements = new Map<ContentElementType, AnyContentElementDo>();

	constructor() {
		this.elements.set(
			ContentElementType.TEXT,
			new TextElement({
				text: ``,
			})
		);
		this.elements.set(
			ContentElementType.FILE,
			new FileElement({
				caption: ``,
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
