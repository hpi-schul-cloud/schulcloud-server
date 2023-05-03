import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { FileElementContent, TextElementContent } from '../controller/dto';
import { CardService, ContentElementService } from '../service';

@Injectable()
export class ElementUc {
	constructor(
		private readonly cardService: CardService,
		private readonly elementService: ContentElementService,
		private readonly logger: Logger
	) {
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(userId: EntityId, elementId: EntityId, content: TextElementContent | FileElementContent) {}
}
