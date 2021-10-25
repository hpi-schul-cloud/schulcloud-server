import { ApiProperty } from '@nestjs/swagger';

export class DashboardGridSubElementResponse {
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

	@ApiProperty({
		description: 'X position of the Grid element',
	})
	xPosition: number;

	@ApiProperty({
		description: 'Y position of the Grid element',
	})
	yPosition: number;

	@ApiProperty({
		type: [DashboardGridSubElementResponse],
		description: 'List of all subelements in the group',
	})
	groupElements: DashboardGridSubElementResponse[];
}

export class DashboardResponse {
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
