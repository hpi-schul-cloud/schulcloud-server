/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	BoardsClientAdapter,
	CardClientAdapter,
	ColumnClientAdapter,
	CourseRoomsClientAdapter,
	CoursesClientAdapter,
	FilesStorageClientAdapter,
	LessonClientAdapter,
} from './adapter';
export { FileRecordParentType, FileRecordResponse, FileRecordScanStatus, StorageLocation } from './fs-generated/models';
export {
	BoardColumnBoardResponse,
	BoardElementResponseType,
	BoardLayout,
	BoardLessonResponse,
	BoardResponse,
	BoardTaskResponse,
	CardControllerCreateElement201Response,
	CardListResponse,
	CardResponse,
	CardResponseElementsInner,
	CardSkeletonResponse,
	Colors,
	ColumnResponse,
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentTextPropsImpl,
	ContentElementType,
	CourseCommonCartridgeMetadataResponse,
	FileElementContent,
	FileElementContentBody,
	FileElementResponse,
	FileFolderElementContent,
	FileFolderElementContentBody,
	FileFolderElementResponse,
	LessonContentResponse,
	LessonContentResponseComponent,
	LessonContentResponseContent,
	LessonLinkedTaskResponse,
	LessonResponse,
	LinkElementContent,
	LinkElementContentBody,
	LinkElementResponse,
	RichTextElementContent,
	RichTextElementContentBody,
	RichTextElementResponse,
	SingleColumnBoardResponse,
	TimestampsResponse,
} from './generated';
