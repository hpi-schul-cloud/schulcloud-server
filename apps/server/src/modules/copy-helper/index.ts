/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { CopyHelperModule } from './copy-helper.module';
export { CopyApiResponse } from './dto/copy.response';
export { CopyMapper } from './mapper/copy.mapper';
export { CopyFilesService } from './service/copy-files.service';
export { CopyHelperService } from './service/copy-helper.service';
export { CopyDictionary, CopyElementType, CopyStatus, CopyStatusEnum, FileUrlReplacement } from './types';
