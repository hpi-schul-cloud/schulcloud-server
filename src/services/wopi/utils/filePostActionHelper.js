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

 const actionHeaderMap = {
   'DELETE': deleteFile
 };

 module.exports = header => {
   return actionHeaderMap[header];
 };