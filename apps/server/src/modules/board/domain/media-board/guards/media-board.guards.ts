/**
 * Type guards for media board nodes.
 * These guards are separated from the type definitions to break circular dependencies.
 */

import { DeletedElement } from '../../deleted-element.do';
import { MediaExternalToolElement } from '../media-external-tool-element.do';
import type { IBoardNode } from '../../interface';

// Re-export individual type guards
export { isMediaExternalToolElement } from '../media-external-tool-element.do';
export { isMediaBoard } from '../media-board.do';
export { isMediaLine } from '../media-line.do';

/**
 * Media element union type for type guards.
 */
export type MediaElementUnion = MediaExternalToolElement | DeletedElement;

/**
 * Type guard to check if a board node is a media element.
 */
export const isAnyMediaElement = (boardNode: IBoardNode): boardNode is MediaElementUnion => {
	const result = boardNode instanceof MediaExternalToolElement || boardNode instanceof DeletedElement;

	return result;
};
