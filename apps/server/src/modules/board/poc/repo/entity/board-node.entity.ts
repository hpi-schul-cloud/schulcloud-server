import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { AnyBoardNode, BoardExternalReference, BoardLayout, BoardNodeType, InputFormat, ROOT_PATH } from '../../domain';
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

	// Card, Column, ColumnBoard, LinkElement
	// --------------------------------------------------------------------------
	@Property({ nullable: true })
	title: string | undefined;

	// LinkElement, DrawingElement
	@Property({ type: 'string', nullable: true })
	description: string | undefined;

	// Card
	// --------------------------------------------------------------------------
	@Property({ type: 'integer', nullable: true })
	height: number | undefined;

	// ColumnBoard
	// --------------------------------------------------------------------------
	@Embedded(() => Context, { prefix: false, nullable: true })
	_context: BoardNodeEntityProps['context'];

	get context(): BoardExternalReference | undefined {
		return this._context;
	}

	// We have to make sure that the embedded object is an instance of the embeddable class.
	// Otherwise the property decorators of the embeddable wouldn't work.
	set context(context: BoardExternalReference | undefined) {
		if (context instanceof Context || context === undefined) {
			this._context = context;
		} else {
			this._context = new Context(context);
		}
	}

	@Property({ type: 'boolean', nullable: true })
	isVisible: boolean | undefined;

	@Property({ type: 'boolean', nullable: true })
	layout: BoardLayout | undefined;

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

	// ExternalToolElement
	// --------------------------------------------------------------------------
	@Property({ type: 'string', nullable: true })
	contextExternalToolId: string | undefined;
}
