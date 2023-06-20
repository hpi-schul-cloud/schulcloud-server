import { Card } from '../card.do';
import { ColumnBoard } from '../column-board.do';
import { Column } from '../column.do';
import { AnyContentElementDo } from './any-content-element-do';
import { AnyContentSubElementDo } from './any-content-subelement-do';

export type AnyBoardDo = ColumnBoard | Column | Card | AnyContentElementDo | AnyContentSubElementDo;
