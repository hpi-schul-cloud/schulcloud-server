import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { AnyContentElementResponse } from '../dto/element/any-content-element.response';

export interface BaseResponseMapper<T = AnyBoardDo> {
	mapToResponse(element: T): AnyContentElementResponse;

	canMap(element: T): boolean;
}
