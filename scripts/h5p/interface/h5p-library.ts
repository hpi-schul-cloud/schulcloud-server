// Define the structure of an H5P library as per the H5P specification
// See: https://h5p-schema.sindre.is/library.schema.json

export interface H5PLibrary {
	machineName: string;
	title: string;
	majorVersion: number;
	minorVersion: number;
	patchVersion: number;
	runnable: number;
	coreApi: {
		majorVersion: number;
		minorVersion: number;
	};
	preloadedJs?: Array<{ path: string }>;
	preloadedCss?: Array<{ path: string }>;
	editorJs?: Array<{ path: string }>;
	editorCss?: Array<{ path: string }>;
	preloadedDependencies?: Array<H5PLibraryDependency>;
	dynamicDependencies?: Array<H5PLibraryDependency>;
	editorDependencies?: Array<H5PLibraryDependency>;
	author?: string;
	license?: string;
	semantics?: Array<any>;
	language?: { [key: string]: string };
	dropLibraryCss?: Array<string>;
	embedTypes?: Array<string>;
	fullscreen?: number;
	contentType?: string;
	metadataSettings?: Array<any>;
	exportSettings?: Array<any>;
	allowFullscreen?: boolean;
	allowDownload?: boolean;
	allowCopyright?: boolean;
	allowEmbed?: boolean;
	allowFrame?: boolean;
	allowResize?: boolean;
	allowExport?: boolean;
	allowPrint?: boolean;
	allowCopy?: boolean;
	allowPaste?: boolean;
	allowDelete?: boolean;
	allowMove?: boolean;
	allowEdit?: boolean;
	allowCreate?: boolean;
	allowSave?: boolean;
	allowLoad?: boolean;
	allowImport?: boolean;
	allowExportToLms?: boolean;
	allowExportToScorm?: boolean;
	allowExportToXapi?: boolean;
	allowExportToCmi5?: boolean;
	allowExportToLrs?: boolean;
	allowExportToPdf?: boolean;
	allowExportToWord?: boolean;
	allowExportToExcel?: boolean;
	allowExportToPowerpoint?: boolean;
	allowExportToHtml?: boolean;
	allowExportToText?: boolean;
	allowExportToImage?: boolean;
	allowExportToAudio?: boolean;
	allowExportToVideo?: boolean;
	allowExportToZip?: boolean;
	allowExportToTar?: boolean;
	allowExportToRar?: boolean;
	allowExportTo7z?: boolean;
	allowExportToGz?: boolean;
	allowExportToBz2?: boolean;
	allowExportToXz?: boolean;
	allowExportToLzma?: boolean;
	allowExportToLzo?: boolean;
	allowExportToLz4?: boolean;
	allowExportToSnappy?: boolean;
	allowExportToZstd?: boolean;
	allowExportToOther?: boolean;
	[key: string]: any; // For additional properties not explicitly listed
}

export interface H5PLibraryDependency {
	machineName: string;
	majorVersion: number;
	minorVersion: number;
}
