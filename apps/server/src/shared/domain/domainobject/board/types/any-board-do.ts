import { Card } from '../card.do';
import { Column } from '../column.do';
import { ColumnBoard } from '../column-board.do';
import { ContentElement } from '../content-element.do';

export type AnyBoardDo = ColumnBoard | Column | Card | ContentElement;
