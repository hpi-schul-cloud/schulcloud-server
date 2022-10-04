import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';

export class DashboardGridSubElementResponse {
	constructor({ id, title, shortTitle, displayColor }: DashboardGridSubElementResponse) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@DecodeHtmlEntities()
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
	constructor({
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

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id?: string;

	@DecodeHtmlEntities()
	@ApiProperty({
		description: 'Title of the Grid element',
	})
	title?: string;

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
