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
				element = this.buildText();
				break;
			case ContentElementType.FILE:
				element = this.buildFile();
				break;
			default:
				break;
		}

		if (!element) {
			throw new NotImplementedException(`unknown type ${type} of element`);
		}

		return element;
	}

	private buildText() {
		const element = new TextElement({
			text: ``,
		});

		return element;
	}

	private buildFile() {
		const element = new FileElement({
			caption: ``,
		});

		return element;
	}
}
