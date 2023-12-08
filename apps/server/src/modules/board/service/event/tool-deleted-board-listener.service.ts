import { AbstractEventListener, EventReceivedLoggable, EventService } from '@infra/event';
import { Injectable } from '@nestjs/common';
import { AnyContentElementDo } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';
import { ContextExternalToolDeletedEvent } from '@modules/tool/context-external-tool';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContentElementService } from '../content-element.service';

@Injectable()
export class ToolDeletedBoardListener extends AbstractEventListener<ContextExternalToolDeletedEvent> {
	constructor(
		private readonly eventService: EventService,
		private readonly contentElementService: ContentElementService,
		private readonly logger: Logger
	) {
		super();
		this.eventService.addEventListener(ContextExternalToolDeletedEvent, this);
	}

	async handleEvent(event: ContextExternalToolDeletedEvent): Promise<void> {
		this.logger.debug(new EventReceivedLoggable(event.getEventName()));
		if (event.payload.contextType !== ToolContextType.BOARD_ELEMENT) {
			return;
		}
		const element: AnyContentElementDo = await this.contentElementService.findById(event.payload.contextId);
		await this.contentElementService.delete(element);
	}
}
