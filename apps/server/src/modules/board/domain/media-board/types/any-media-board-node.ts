import type { MediaBoard } from '../media-board.do';
import type { MediaExternalToolElement } from '../media-external-tool-element.do';
import type { MediaLine } from '../media-line.do';

export type AnyMediaBoardNode = MediaBoard | MediaLine | MediaExternalToolElement;
