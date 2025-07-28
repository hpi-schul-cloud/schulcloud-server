import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';

export class DashboardGridSubElementResponse {
	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: bsonStringPattern,
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

	constructor(props: DashboardGridSubElementResponse) {
		this.id = props.id;
		this.title = props.title;
		this.shortTitle = props.shortTitle;
		this.displayColor = props.displayColor;
	}
}

export class DashboardGridElementResponse {
	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: bsonStringPattern,
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
		pattern: bsonStringPattern,
	})
	groupId?: string;

	@ApiProperty({
		type: [DashboardGridSubElementResponse],
		description: 'List of all subelements in the group',
	})
	groupElements?: DashboardGridSubElementResponse[];

	@ApiProperty({
		description: 'Start of the copying process if it is still ongoing - otherwise property is not set.',
	})
	copyingSince?: Date;

	@ApiProperty({
		description: 'Is the course synchronized with a group?',
	})
	isSynchronized: boolean;

	@ApiProperty({
		description: 'Indicates if the course is locked and cannot be accessed.',
	})
	isLocked: boolean;

	constructor(props: DashboardGridElementResponse) {
		this.id = props.id;
		this.title = props.title;
		this.shortTitle = props.shortTitle;
		this.displayColor = props.displayColor;
		this.xPosition = props.xPosition;
		this.yPosition = props.yPosition;
		this.groupId = props.groupId;
		this.groupElements = props.groupElements;
		this.copyingSince = props.copyingSince;
		this.isSynchronized = props.isSynchronized;
		this.isLocked = props.isLocked;
	}
}

export class DashboardResponse {
	constructor({ id, gridElements }: DashboardResponse) {
		this.id = id;
		this.gridElements = gridElements;
	}

	@ApiProperty({
		description: 'The id of the Dashboard entity',
		pattern: bsonStringPattern,
	})
	id: string;

	@ApiProperty({
		type: [DashboardGridElementResponse],
		description: 'List of all elements visible on the dashboard',
	})
	gridElements: DashboardGridElementResponse[];
}
