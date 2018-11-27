const mongoose = require('mongoose');
const FileModel = require('../../fileStorage/model').fileModel;
const errors = require('feathers-errors');

/**
 * Just because the route /wopi/files/:id should trigger different actions for a different 'X-WOPI-Override' header value,
 * this helper uses the correct function for a specific header
 */

 /** https://wopirest.readthedocs.io/en/latest/files/DeleteFile.html */
 const deleteFile = (file, payload, account, app) => {
   let fileStorageService = app.service('fileStorage');
   return fileStorageService.remove(null, {
    query: {path: file.key},
    payload: payload,
    account: account
  });
 };

 /** https://wopirest.readthedocs.io/en/latest/files/Lock.html
  * https://wopirest.readthedocs.io/en/latest/files/RefreshLock.html
  * adoption: the lockId was checked in a hook before
  */
 const lock = (file) => {
   file.lockId = mongoose.Types.ObjectId();
   return FileModel.update({_id: file._id}, file).exec().then(_ => {
     return Promise.resolve({lockId: file.lockId});
   });
 };

 /** https://wopirest.readthedocs.io/en/latest/files/GetLock.html */
 const getLock = (file) => {
  return FileModel.findOne({_id: file._id}).exec().then(_ => {
    return Promise.resolve({lockId: file.lockId});
  });
 };

 /** https://wopirest.readthedocs.io/en/latest/files/Unlock.html */
 const unlock = (file) => {
   return FileModel.update({_id: file._id}, {$unset: {lockId: 1}}).exec();
 };

 /** https://wopirest.readthedocs.io/en/latest/files/RenameFile.html */
 const renameFile = (file, payload, account, app) => {
  let fileRenameService = app.service('fileStorage/rename');
  return fileRenameService.create({
    path: file.key,
    newName: payload.wopiRequestedName,
    userPayload: payload,
    account: account
  });
 };

 /** https://wopirest.readthedocs.io/en/latest/files/GetShareUrl.html */
 const shareUrl = (file, payload, account, app) => {
	throw new errors.NotImplemented("This function is currently not implemented!");
 };

 /** https://wopirest.readthedocs.io/en/latest/files/PutUserInfo.html */
 const putUserInfo = (file, payload, account, app) => {
	throw new errors.NotImplemented("This function is currently not implemented!");
 };


 const actionHeaderMap = {
   'DELETE': deleteFile,
   'LOCK': lock,
   'GET_LOCK': getLock,
   'UNLOCK': unlock,
   'REFRESH_LOCK': lock,
   'RENAME_FILE': renameFile,
   'GET_SHARE_URL': shareUrl,
   'PUT_USER_INFO': putUserInfo
 };

 module.exports = header => {
   return actionHeaderMap[header];
 };
