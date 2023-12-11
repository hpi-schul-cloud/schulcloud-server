import { AbstractEventListener, EventReceivedLoggable, EventService } from '@infra/event';
import { ToolContextType } from '@modules/tool/common/enum';
import {
	ContextExternalToolDeletedEventContent,
	ContextExternalToolsDeletedEvent,
} from '@modules/tool/context-external-tool';
import { Injectable } from '@nestjs/common';
import { AnyContentElementDo } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';
import { ContentElementService } from '../content-element.service';

@Injectable()
export class ToolsDeletedBoardListener extends AbstractEventListener<ContextExternalToolsDeletedEvent> {
	constructor(
		private readonly eventService: EventService,
		private readonly contentElementService: ContentElementService,
		private readonly logger: Logger
	) {
		super();
		this.eventService.addEventListener(ContextExternalToolsDeletedEvent, this);
	}

	async handleEvent(event: ContextExternalToolsDeletedEvent): Promise<void> {
		this.logger.debug(new EventReceivedLoggable(event.getEventName()));
		const boardContentIds: string[] = event.payload
			.filter(
				(payload: ContextExternalToolDeletedEventContent) => payload.contextType === ToolContextType.BOARD_ELEMENT
			)
			.map((payload: ContextExternalToolDeletedEventContent) => payload.contextId);

		if (boardContentIds.length === 0) {
			return;
		}

		const elements: AnyContentElementDo[] = await this.contentElementService.findByIds(boardContentIds);

		await Promise.all(elements.map(async (element) => this.contentElementService.delete(element)));
	}
}
