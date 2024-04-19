import { BoardNodeType } from '@shared/domain/entity';
import type { AnyBoardNodeProps, CardProps, ColumnBoardProps, ColumnProps } from '../domain';

export const isColumnBoardProps = (entity: AnyBoardNodeProps): entity is ColumnBoardProps =>
	entity.type === BoardNodeType.COLUMN_BOARD;

export const isColumnProps = (entity: AnyBoardNodeProps): entity is ColumnProps => entity.type === BoardNodeType.COLUMN;

export const isCardProps = (entity: AnyBoardNodeProps): entity is CardProps => entity.type === BoardNodeType.CARD;
