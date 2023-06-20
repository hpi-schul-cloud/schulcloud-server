import { SubmissionSubElement } from '../submission-subelment.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentSubElementDo = SubmissionSubElement;

export const isAnyContentSubElement = (element: AnyBoardDo): element is AnyContentSubElementDo => {
	const result = element instanceof SubmissionSubElement;

	return result;
};
