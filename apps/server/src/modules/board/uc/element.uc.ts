import { Injectable } from '@nestjs/common';
import { EntityId, FileElement, TextElement } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { FileElementContent, TextElementContent } from '../controller/dto';
import { ContentElementService } from '../service';

@Injectable()
export class ElementUc {
	constructor(private readonly elementService: ContentElementService, private readonly logger: Logger) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(userId: EntityId, elementId: EntityId, content: TextElementContent | FileElementContent) {
		let element = await this.elementService.findById(elementId);
		if (element instanceof TextElement) {
			element = this.updateTextElement(element, content as TextElementContent);
		} else if (element instanceof FileElement) {
			element = this.updateFileElement(element, content as FileElementContent);
		} else {
			throw new Error(`unknown element type for update`);
		}
		await this.elementService.update(element);
	}

	updateTextElement(element: TextElement, content: TextElementContent) {
		element.text = content.text;
		return element;
	}

	updateFileElement(element: FileElement, content: FileElementContent) {
		element.caption = content.caption;
		return element;
	}
}
