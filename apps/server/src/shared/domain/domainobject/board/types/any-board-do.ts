import { Card } from '../card.do';
import { ColumnBoard } from '../column-board.do';
import { Column } from '../column.do';
import { AnyContentElementDo } from './any-content-element-do';

export type AnyBoardDo = ColumnBoard | Column | Card | AnyContentElementDo;
