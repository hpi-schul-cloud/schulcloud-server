import type { MediaBoard } from '../media-board.do';
import type { MediaLine } from '../media-line.do';
import { type AnyMediaElement } from './any-media-element';

export type AnyMediaBoardNode = MediaBoard | MediaLine | AnyMediaElement;
