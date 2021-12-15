import { ApiProperty } from '@nestjs/swagger';
import { LearnroomMetadata, GridElementWithPosition, DashboardEntity } from '@shared/domain';

export class DashboardGridSubElementResponse {
	private constructor({ id, title, shortTitle, displayColor }: DashboardGridSubElementResponse) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
	}

	static FromLearnroomMetadata(metadata: LearnroomMetadata): DashboardGridSubElementResponse {
		return new DashboardGridSubElementResponse(metadata);
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Title of the Grid element',
	})
	title: string;

	@ApiProperty({
		description: 'Short title of the Grid element',
	})
	shortTitle: string;

	@ApiProperty({
		description: 'Color of the Grid element',
	})
	displayColor: string;
}

export class DashboardGridElementResponse {
	private constructor({
		id,
		title,
		shortTitle,
		displayColor,
		xPosition,
		yPosition,
		groupId,
		groupElements,
	}: DashboardGridElementResponse) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
		this.xPosition = xPosition;
		this.yPosition = yPosition;
		this.groupId = groupId;
		this.groupElements = groupElements;
	}

	static FromGridElementWithPosition(data: GridElementWithPosition): DashboardGridElementResponse {
		const elementData = data.gridElement.getContent();
		const position = data.pos;
		const dto = new DashboardGridElementResponse({
			title: elementData.title,
			shortTitle: elementData.shortTitle,
			displayColor: elementData.displayColor,
			xPosition: position.x,
			yPosition: position.y,
		});
		if (elementData.referencedId) {
			dto.id = elementData.referencedId;
		}
		if (elementData.group && elementData.groupId) {
			dto.groupId = elementData.groupId;
			dto.groupElements = elementData.group.map((groupMetadata) =>
				DashboardGridSubElementResponse.FromLearnroomMetadata(groupMetadata)
			);
		}
		return dto;
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id?: string;

	@ApiProperty({
		description: 'Title of the Grid element',
	})
	title: string;

	@ApiProperty({
		description: 'Short title of the Grid element',
	})
	shortTitle: string;

	@ApiProperty({
		description: 'Color of the Grid element',
	})
	displayColor: string;

	@ApiProperty({
		description: 'X position of the Grid element',
	})
	xPosition: number;

	@ApiProperty({
		description: 'Y position of the Grid element',
	})
	yPosition: number;

	@ApiProperty({
		description: 'The id of the group element',
		pattern: '[a-f0-9]{24}',
	})
	groupId?: string;

	@ApiProperty({
		type: [DashboardGridSubElementResponse],
		description: 'List of all subelements in the group',
	})
	groupElements?: DashboardGridSubElementResponse[];
}

export class DashboardResponse {
	constructor({ id, gridElements }: DashboardResponse) {
		this.id = id;
		this.gridElements = gridElements;
	}

	static FromEntity(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse({
			id: dashboard.getId(),
			gridElements: dashboard
				.getGrid()
				.map((elementWithPosition) => DashboardGridElementResponse.FromGridElementWithPosition(elementWithPosition)),
		});
		return dto;
	}

	@ApiProperty({
		description: 'The id of the Dashboard entity',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		type: [DashboardGridElementResponse],
		description: 'List of all elements visible on the dashboard',
	})
	gridElements: DashboardGridElementResponse[];
}
