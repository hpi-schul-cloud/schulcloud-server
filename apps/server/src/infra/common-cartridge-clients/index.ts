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
	CoursesClientAdapter,
	LessonClientAdapter,
	CourseRoomsClientAdapter,
	FilesStorageClientAdapter,
} from './adapter';
export * from './generated';
export * from './fs-generated/models';
