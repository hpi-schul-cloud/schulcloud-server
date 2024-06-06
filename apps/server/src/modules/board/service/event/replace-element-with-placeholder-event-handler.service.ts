import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { ReplaceElementWithPlaceholderEvent } from '@modules/tool/context-external-tool/domain/event';
import { ReplaceElementService } from '../../domain/interface/replace-element-service';

@Injectable()
@EventsHandler(ReplaceElementWithPlaceholderEvent)
export class ReplaceElementWithPlaceholderEventHandlerService
	implements ReplaceElementService, IEventHandler<ReplaceElementWithPlaceholderEvent>
{
	constructor(
		// elementService
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(ReplaceElementWithPlaceholderEvent.name);
	}

	public async handle({ contextExternalToolId, type, title }: ReplaceElementWithPlaceholderEvent) {
		// for spec files

		const placeholder = await this.replaceElement(contextExternalToolId, type, title);

		await this.eventBus.publish(new ReplaceElementWithPlaceholderEvent(contextExternalToolId, type, title));
	}

	public async replaceElement(
		contextExternalToolId: EntityId,
		type: ContentElementType,
		title: string | undefined
	): Promise<void> {
		// get elements with contextexternaltool id
		// replace them with placeholder element
		// this.logger.info(
		//	new DataDeletionDomainOperationLoggable('Deleting Context external tool', DomainName.BOARD, userId, StatusModel.PENDING)
		// return '';
	}
}
