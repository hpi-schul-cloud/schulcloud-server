import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '../../../../../core/logger';
import { ContextExternalTool } from '../index';
import { ReplaceElementWithPlaceholderEvent } from './replace-element-with-placeholder.event';
import { SchoolExternalToolService } from '../../../school-external-tool';
import { ReplaceElementService } from '../../../../board/domain/interface/replace-element-service';

@Injectable()
@EventsHandler(ReplaceElementWithPlaceholderEvent)
export class ReplaceElementWithPlaceholderEventHandlerService
	implements ReplaceElementService, IEventHandler<ReplaceElementWithPlaceholderEvent>
{
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(ReplaceElementWithPlaceholderEvent.name);
	}

	public async handle() {
		// for spec files
	}

	public async replaceElement(tool: ContextExternalTool): Promise<void> {
		// get elements with contextexternaltool id
		// replace them with placeholder element
		// this.logger.info(
		//	new DataDeletionDomainOperationLoggable('Deleting Context external tool', DomainName.BOARD, userId, StatusModel.PENDING)
		// return '';
	}
}
