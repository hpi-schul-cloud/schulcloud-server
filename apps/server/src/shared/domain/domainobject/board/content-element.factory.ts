import { Injectable, NotImplementedException } from '@nestjs/common';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import { AnyContentElementDo } from './types/any-content-element-do';
import { ContentElementType } from './types/content-elements.enum';

@Injectable()
export class ContentElementFactory {
	build(type: ContentElementType): AnyContentElementDo {
		let element!: AnyContentElementDo;

		switch (type) {
			case ContentElementType.TEXT:
				element = new TextElement({
					text: ``,
				});
				break;
			case ContentElementType.FILE:
				element = new FileElement({
					caption: ``,
				});
				break;
			default:
				break;
		}

		if (!element) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return element;
	}
}
