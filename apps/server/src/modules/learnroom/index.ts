/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { LEARNROOM_PUBLIC_API_CONFIG_TOKEN, LearnroomConfig, LearnroomPublicApiConfig } from './learnroom.config';
export * from './learnroom.module';
export { CourseCopyService } from './service';
