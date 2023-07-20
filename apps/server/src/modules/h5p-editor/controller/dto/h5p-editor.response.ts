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
		this.contentId = id;
		this.metadata = metadata;
	}

	@ApiProperty()
	contentId!: string;

	@ApiProperty({ type: H5PContentMetadata })
	metadata!: H5PContentMetadata;
}
