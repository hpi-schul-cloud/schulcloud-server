/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export * from './course.module';
export { Course, CourseDoService, CourseService, CourseSyncService, CourseSyncAttribute } from './domain';
