import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { EntityId } from '@shared/domain/types';

export class CourseCommonCartridgeMetadataResponse {
	constructor(id: EntityId, title: string, copyrightOwners: string[], creationDate?: Date) {
		this.id = id;
		this.title = title;
		this.creationDate = creationDate;
		this.copyRightOwners = copyrightOwners;
	}

	@ApiProperty({
		description: 'The id of the course',
		pattern: bsonStringPattern,
	})
	id: string;

	@ApiProperty({
		description: 'Title of the course',
	})
	title: string;

	@ApiProperty({
		description: 'Creation date of the course',
	})
	creationDate?: Date;

	@ApiProperty({
		description: 'Copy right owners of the course',
	})
	copyRightOwners: string[];
}
