import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { FileContentBody, TextContentBody } from '../controller/dto';
import { ContentElementService } from '../service';

@Injectable()
export class ElementUc {
	constructor(private readonly elementService: ContentElementService, private readonly logger: Logger) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(userId: EntityId, elementId: EntityId, content: TextContentBody | FileContentBody) {
		const element = await this.elementService.findById(elementId);
		await this.elementService.update(element, content);
	}
}
