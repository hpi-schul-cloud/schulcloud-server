import { ContentParameters, IContentMetadata, IEditorModel, IIntegration } from '@lumieducation/h5p-server';
import { ApiProperty } from '@nestjs/swagger';

export class H5PEditorModelResponse {
	constructor(editorModel: IEditorModel) {
		this.integration = editorModel.integration;
		this.scripts = editorModel.scripts;
		this.styles = editorModel.styles;
	}

	@ApiProperty()
	integration: IIntegration;

	// This is a list of URLs that point to the Javascript files the H5P editor needs to load
	@ApiProperty()
	scripts: string[];

	// This is a list of URLs that point to the CSS files the H5P editor needs to load
	@ApiProperty()
	styles: string[];
}

interface H5PContentResponse {
	h5p: IContentMetadata;
	library: string;
	params: {
		metadata: IContentMetadata;
		params: ContentParameters;
	};
}

export class H5PEditorModelContentResponse extends H5PEditorModelResponse {
	constructor(editorModel: IEditorModel, content: H5PContentResponse) {
		super(editorModel);

		this.library = content.library;
		this.metadata = content.params.metadata;
		this.params = content.params.params;
	}

	@ApiProperty()
	library: string;

	@ApiProperty()
	metadata: IContentMetadata;

	@ApiProperty()
	params: unknown;
}

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
