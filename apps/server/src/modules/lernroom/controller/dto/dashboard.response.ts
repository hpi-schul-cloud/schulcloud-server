import { ApiProperty } from '@nestjs/swagger';

export class DashboardGridElement {
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
		description: 'Hyperlink of the Grid element',
	})
	url: string;

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
}

export class DashboardResponse {
	@ApiProperty({
		description: 'The id of the Dashboard entity',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'List of all elements visible on the dashboard',
	})
	gridElements: DashboardGridElement[];
}
