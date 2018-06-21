const mongoose = require('mongoose');
const FileModel = require('../../fileStorage/model').fileModel;

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
  * adoption: the lockId was checked in a hook before
  */
 const lock = (file) => {
   file.lockId = mongoose.Types.ObjectId();
   return FileModel.update({_id: file._id}, file).exec().then(_ => {
     return Promise.resolve({lockId: file.lockId});
   });
 };

 /** https://wopirest.readthedocs.io/en/latest/files/GetLock.html */
 const getLock = (file, payload, account, app) => {
  return FileModel.findOne({_id: file._id}).exec().then(result => {
    return Promise.resolve({lockId: file.lockId});
  });
 };

 const actionHeaderMap = {
   'DELETE': deleteFile,
   'LOCK': lock,
   'GET_LOCK': getLock
 };

 module.exports = header => {
   return actionHeaderMap[header];
 };