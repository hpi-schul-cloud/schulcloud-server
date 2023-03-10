import { Card } from './card.do';
import { ColumnBoard } from './column-board.do';
import { Column } from './column.do';
import { TextElement } from './text-element.do';

export type AnyBoardDo = ColumnBoard | Column | Card | TextElement;
