import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId, InputFormat } from '@shared/domain/types';
import { AnyBoardNode, BoardLayout, BoardNodeType, ROOT_PATH } from '../../domain';
import type { BoardNodeEntityProps } from '../types';
import { Context } from './embeddables';
import { ObjectIdType } from './object-id-type';

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

	// Card, Column, ColumnBoard, LinkElement, MedialLine
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

	// ColumnBoard
	// --------------------------------------------------------------------------
	@Property({ type: 'boolean', nullable: true })
	isVisible: boolean | undefined;

	@Enum({ type: 'BoardLayout', nullable: true })
	layout: BoardLayout | undefined;

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

	@Property({ type: 'string', nullable: true })
	userId: string | undefined;

	// ExternalToolElement, MediaExternalToolElement
	// --------------------------------------------------------------------------
	@Property({ type: ObjectIdType, fieldName: 'contextExternalTool', nullable: true })
	contextExternalToolId: EntityId | undefined;
}
