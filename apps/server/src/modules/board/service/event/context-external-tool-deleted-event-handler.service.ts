import { ObjectId } from '@mikro-orm/mongodb';
import { ContextExternalToolDeletedEvent } from '@modules/tool/context-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@src/core/logger';
import { AnyBoardNode, ContentElementType, DeletedElement, ROOT_PATH } from '../../domain';
import { BoardNodeService } from '../board-node.service';

@Injectable()
@EventsHandler(ContextExternalToolDeletedEvent)
export class ContextExternalToolDeletedEventHandlerService implements IEventHandler<ContextExternalToolDeletedEvent> {
	constructor(private readonly boardNodeService: BoardNodeService, private readonly logger: Logger) {
		this.logger.setContext(ContextExternalToolDeletedEventHandlerService.name);
	}

	public async handle(event: ContextExternalToolDeletedEvent) {
		const elements: AnyBoardNode[] = await this.boardNodeService.findElementsByContextExternalToolId(event.id);

		elements.map(async (element: AnyBoardNode): Promise<void> => {
			const placeholder: DeletedElement = new DeletedElement({
				id: new ObjectId().toHexString(),
				path: ROOT_PATH,
				level: 0,
				position: 0,
				children: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedElementType: ContentElementType.EXTERNAL_TOOL,
				title: event.title,
			});

			await this.boardNodeService.replace(element, placeholder);
		});
	}
}
