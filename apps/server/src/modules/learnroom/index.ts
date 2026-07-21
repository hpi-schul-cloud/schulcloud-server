/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { LEARNROOM_PUBLIC_API_CONFIG_TOKEN, LearnroomConfig, LearnroomPublicApiConfig } from './learnroom.config';
export { LearnroomModule } from './learnroom.module';
export { CourseCopyService } from './service';
