import { ObjectId } from '@mikro-orm/mongodb';
import { ContentElementService } from '@modules/board';
import {
	ContextExternalToolDeletedEvent,
	ContextExternalToolsDeletedEvent,
} from '@modules/tool/context-external-tool/domain/event';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ContentElementType, ExternalToolElement, PlaceholderElement } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';

@Injectable()
@EventsHandler(ContextExternalToolDeletedEvent)
export class ContextExternalToolDeletedEventHandlerService implements IEventHandler<ContextExternalToolDeletedEvent> {
	constructor(private readonly contentElementService: ContentElementService, private readonly logger: Logger) {
		this.logger.setContext(ContextExternalToolsDeletedEvent.name);
	}

	public async handle(event: ContextExternalToolDeletedEvent) {
		const elements: ExternalToolElement[] = await this.contentElementService.findElementsByContextExternalToolId(
			event.id
		);

		elements.map(async (element) => {
			const placeholder: PlaceholderElement = new PlaceholderElement({
				id: new ObjectId().toHexString(),
				children: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				previousElementType: ContentElementType.EXTERNAL_TOOL,
				previousElementDisplayName: event.title,
			});

			await this.contentElementService.replace(element, placeholder);
		});
	}
}
