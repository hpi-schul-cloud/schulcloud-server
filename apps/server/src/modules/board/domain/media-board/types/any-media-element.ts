import { type DeletedElement, isDeletedElement } from '../../deleted-element.do';
import { isMediaExternalToolElement, type MediaExternalToolElement } from '../media-external-tool-element.do';

export type AnyMediaElement = MediaExternalToolElement | DeletedElement;

export const isAnyMediaElement = (boardNode: unknown): boardNode is AnyMediaElement => {
	const result = isMediaExternalToolElement(boardNode) || isDeletedElement(boardNode);

	return result;
};
