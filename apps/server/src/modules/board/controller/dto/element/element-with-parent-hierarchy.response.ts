import { ApiProperty } from '@nestjs/swagger';
import { ParentNodeInfo } from '../../../domain';
import { AnyContentElementResponse } from './any-content-element.response';

export class ElementWithParentHierarchyResponse {
	constructor(props: ElementWithParentHierarchyResponse) {
		this.element = props.element;
		this.parentHierarchy = props.parentHierarchy;
	}

	@ApiProperty({ description: 'The element data' })
	element: AnyContentElementResponse;

	@ApiProperty({ description: 'The hierarchical path of parent elements' })
	parentHierarchy: ParentNodeInfo[];
}
