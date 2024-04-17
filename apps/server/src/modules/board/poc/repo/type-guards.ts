import { BoardNodeType } from '@shared/domain/entity';
import type { AnyBoardNodeProps, CardProps, ColumnBoardProps } from '../domain';

export const isColumnBoardProps = (entity: AnyBoardNodeProps): entity is ColumnBoardProps =>
	entity.type === BoardNodeType.COLUMN_BOARD;

export const isCardProps = (entity: AnyBoardNodeProps): entity is CardProps => entity.type === BoardNodeType.CARD;
