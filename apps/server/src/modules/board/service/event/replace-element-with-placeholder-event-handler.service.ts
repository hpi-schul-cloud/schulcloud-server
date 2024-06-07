import { ContentElementService } from '@modules/board';
import { ReplaceElementWithPlaceholderEvent } from '@modules/tool/context-external-tool/domain/event';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ContentElementType } from '@shared/domain/domainobject';
import { ExternalToolElementNodeEntity } from '@shared/domain/entity';
import { PlaceholderElementNodeEntity } from '@shared/domain/entity/boardnode/placeholder-element-node.entity';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { ReplaceElementService } from '../../domain/interface/replace-element-service';
import { BoardNodeRepo } from '../../repo';
import { RecursiveSaveVisitor } from '../../repo/recursive-save.visitor';

@Injectable()
@EventsHandler(ReplaceElementWithPlaceholderEvent)
export class ReplaceElementWithPlaceholderEventHandlerService
	implements ReplaceElementService, IEventHandler<ReplaceElementWithPlaceholderEvent>
{
	constructor(
		private readonly contentElementService: ContentElementService,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly recursieSaveVisitor: RecursiveSaveVisitor,
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
		// const externalToolElements = await this.contentElementService.findByContent(type);
		// const externalToolElements: ExternalToolElementNodeEntity[] = await this.contentElementService.findElementsById(
		// 	contextExternalToolId
		// );

		await this.contentElementService.replaceElementWithPlaceholder(contextExternalToolId);

		/* externalToolElements.forEach((element) => {
			if (element.parentId) {
				const boardNode = await this.boardNodeRepo.findById(element.parentId);

				const placeholder = new PlaceholderElementNodeEntity({
					title,
					type,
					parent: boardNode,
					position: element.position,
				});
			}
		});
		*/

		/* const elementsToReplace = await Promise.all(
			externalToolElements
				.map(async (boardNode) => {
					const descendants: BoardNode[] = await this.boardNodeRepo.findDescendants(boardNode);
					const element: ExternalToolElement = new BoardDoBuilderImpl(descendants).buildDomainObject(boardNode);
					return element;
				})
				.filter((element) => {})
		); */

		// do we need this? elements are always on depth level 3 and do not have children/descendents...
		// const childrenMap = await this.boardNodeRepo.findDescendantsOfMany(elements);

		// const domainObjects = elements.map((boardNode) => {
		// const children = childrenMap[boardNode.pathOfChildren];
		// const domainObject = new BoardDoBuilderImpl(children).buildDomainObject(boardNode);
		// return domainObject;
		// });

		// await this.boardService.findByIds([contextExternalToolId]);
		// replace them with placeholder element
		// this.logger.info(
		//	new DataDeletionDomainOperationLoggable('Deleting Context external tool', DomainName.BOARD, userId, StatusModel.PENDING)
		// return '';
	}
}
