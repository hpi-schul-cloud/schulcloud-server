import { IContentMetadata } from '@lumieducation/h5p-server';
import { ApiProperty } from '@nestjs/swagger';

export class H5PContentMetadata {
	constructor(metadata: IContentMetadata) {
		this.mainLibrary = metadata.mainLibrary;
		this.title = metadata.title;
	}

	@ApiProperty()
	title: string;

	@ApiProperty()
	mainLibrary: string;
}

export class H5PSaveResponse {
	constructor(id: string, metadata: IContentMetadata) {
		this.id = id;
		this.metadata = metadata;
	}

	@ApiProperty()
	id!: string;

	@ApiProperty({ type: H5PContentMetadata })
	metadata!: H5PContentMetadata;
}
