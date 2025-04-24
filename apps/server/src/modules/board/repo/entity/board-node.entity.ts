import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId, InputFormat } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import {
	AnyBoardNode,
	BoardLayout,
	BoardNodeType,
	ContentElementType,
	MediaBoardColors,
	ROOT_PATH,
} from '../../domain';
import type { BoardNodeEntityProps } from '../types';
import { Context } from './embeddables';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements BoardNodeEntityProps {
	// Generic Tree
	// --------------------------------------------------------------------------
	@Index()
	@Property({ nullable: false })
	path = ROOT_PATH;

	@Property({ nullable: false, type: 'integer' })
	level = 0;

	@Property({ nullable: false, type: 'integer' })
	position = 0;

	@Index()
	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	@Property({ persist: false })
	children: AnyBoardNode[] = [];

	@Property({ persist: false })
	domainObject: AnyBoardNode | undefined;

	// Card, Column, ColumnBoard, LinkElement, MedialLine, DeletedElement
	// --------------------------------------------------------------------------
	@Property({ nullable: true })
	title: string | undefined;

	// LinkElement, DrawingElement
	@Property({ type: 'string', nullable: true })
	description: string | undefined;

	// ColumnBoard, MediaBoard
	// --------------------------------------------------------------------------
	@Embedded(() => Context, { prefix: false, nullable: true })
	context: BoardNodeEntityProps['context'] | undefined;

	@Enum({ type: 'BoardLayout', nullable: true })
	layout: BoardLayout | undefined;

	// ColumnBoard
	// --------------------------------------------------------------------------
	@Property({ type: 'boolean', nullable: true })
	isVisible: boolean | undefined;

	// Card
	// --------------------------------------------------------------------------
	@Property({ type: 'integer', nullable: true })
	height: number | undefined;

	// RichTextElement
	// --------------------------------------------------------------------------
	@Property({ type: 'string', nullable: true })
	text: string | undefined;

	@Enum({ type: 'InputFormat', nullable: true })
	inputFormat: InputFormat | undefined;

	// LinkElement
	// --------------------------------------------------------------------------
	@Property({ type: 'string', nullable: true })
	url: string | undefined;

	@Property({ type: 'string', nullable: true })
	imageUrl: string | undefined;

	@Property({ type: 'string', nullable: true })
	originalImageUrl: string | undefined;

	// FileElement
	// --------------------------------------------------------------------------
	@Property({ type: 'string', nullable: true })
	caption: string | undefined;

	@Property({ type: 'string', nullable: true })
	alternativeText: string | undefined;

	// SubmissionContainerElement
	// --------------------------------------------------------------------------
	@Property({ type: 'Date', nullable: true })
	dueDate: Date | undefined;

	// SubmissionItem
	// --------------------------------------------------------------------------
	@Property({ type: 'boolean', nullable: true })
	completed: boolean | undefined;

	@Property({ type: ObjectIdType, nullable: true })
	userId: EntityId | undefined;

	// ExternalToolElement, MediaExternalToolElement
	// --------------------------------------------------------------------------
	@Property({ type: ObjectIdType, fieldName: 'contextExternalTool', nullable: true })
	contextExternalToolId: EntityId | undefined;

	// H5PElement
	// --------------------------------------------------------------------------
	@Property({ type: ObjectIdType, nullable: true })
	contentId: EntityId | undefined;

	// MediaLine, MediaBoard
	// --------------------------------------------------------------------------
	@Property({ type: 'boolean', nullable: true })
	collapsed: boolean | undefined;

	@Property({ type: 'MediaBoardColors', nullable: true })
	backgroundColor: MediaBoardColors | undefined;

	// DeletedElement
	// --------------------------------------------------------------------------
	@Enum({ type: 'ContentElementType', nullable: true })
	deletedElementType: ContentElementType | undefined;
}
