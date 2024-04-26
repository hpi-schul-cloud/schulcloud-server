import type { Card } from '../card.do';
import type { ColumnBoard } from '../colum-board.do';
import type { Column } from '../column.do';
import type { RichTextElement } from '../rich-text-element.do';

export type AnyBoardNode = ColumnBoard | Card | Column | RichTextElement;
