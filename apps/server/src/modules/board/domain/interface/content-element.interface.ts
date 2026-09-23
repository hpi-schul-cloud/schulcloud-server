import { type IBoardNode } from './board-node.interface';

/**
 * Type alias for content elements (elements that can be placed on a Card).
 * Content elements are a subset of board nodes - this alias provides semantic clarity.
 */
export type IContentElement = IBoardNode;

// Note: ContentElementType enum is defined in ../types/content-element-type.enum.ts
// and should be imported from there to avoid duplication.
