import { CardNode } from '../card-node.entity';
import { ColumnBoardNode } from '../column-board-node.entity';
import { ColumnNode } from '../column-node.entity';
import { TextElementNode } from '../text-element-node.entity';

export type AnyBoardNode = ColumnBoardNode | ColumnNode | CardNode | TextElementNode;
