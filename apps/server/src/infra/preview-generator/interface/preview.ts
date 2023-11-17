export interface PreviewOptions {
	format: string;
	width?: number;
}

export interface PreviewFileOptions {
	originFilePath: string;
	previewFilePath: string;
	previewOptions: PreviewOptions;
}

export interface PreviewResponseMessage {
	previewFilePath: string;
	status: boolean;
}
