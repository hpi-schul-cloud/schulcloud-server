import { Card } from '../card.do';
import { ColumnBoard } from '../column-board.do';
import { Column } from '../column.do';
import { SubmissionItem } from '../submission-item.do';
import { AnyContentElementDo } from './any-content-element-do';
import { AnyMediaBoardDo } from './any-media-board-do';

export type AnyBoardDo = ColumnBoard | Column | Card | AnyContentElementDo | SubmissionItem | AnyMediaBoardDo;
