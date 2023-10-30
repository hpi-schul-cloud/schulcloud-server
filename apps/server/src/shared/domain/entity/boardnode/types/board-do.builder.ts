import { Card } from '@shared/domain/domainobject/board/card.do';
import { ColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import { Column } from '@shared/domain/domainobject/board/column.do';
import { ExternalToolElement } from '@shared/domain/domainobject/board/external-tool-element.do';
import { FileElement } from '@shared/domain/domainobject/board/file-element.do';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { RichTextElement } from '@shared/domain/domainobject/board/rich-text-element.do';
import { SubmissionContainerElement } from '@shared/domain/domainobject/board/submission-container-element.do';
import { SubmissionItem } from '@shared/domain/domainobject/board/submission-item.do';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import type { ExternalToolElementNodeEntity } from '../external-tool-element-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { LinkElementNode } from '../link-element-node.entity';
import type { RichTextElementNode } from '../rich-text-element-node.entity';
import type { SubmissionContainerElementNode } from '../submission-container-element-node.entity';
import type { SubmissionItemNode } from '../submission-item-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildFileElement(boardNode: FileElementNode): FileElement;
	buildLinkElement(boardNode: LinkElementNode): LinkElement;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	buildSubmissionContainerElement(boardNode: SubmissionContainerElementNode): SubmissionContainerElement;
	buildSubmissionItem(boardNode: SubmissionItemNode): SubmissionItem;
	buildExternalToolElement(boardNode: ExternalToolElementNodeEntity): ExternalToolElement;
}
