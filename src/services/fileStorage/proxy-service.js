'use strict';
const pathUtil = require('path').posix;
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const errors = require('feathers-errors');
const swaggerDocs = require('./docs/');
const filePermissionHelper = require('./utils/filePermissionHelper');
const removeLeadingSlash = require('./utils/filePathHelper').removeLeadingSlash;
const generateFlatFileName = require('./utils/filePathHelper').generateFileNameSuffix;
const FileModel = require('./model').fileModel;
const DirectoryModel = require('./model').directoryModel;

const strategies = {
	awsS3: AWSStrategy
};

const createCorrectStrategy = (fileStorageType) => {
	const strategy = strategies[fileStorageType];
	if (!strategy) throw new errors.BadRequest("No file storage provided for this school");
	return new strategy();
};

/** find all files in deleted (virtual) directory with regex (also nested) **/
const deleteAllFilesInDirectory = (path, fileStorageType, userId) => {
	return FileModel.find({path: {$regex : "^" + path}}).exec()
		.then(files => {
			// delete virtual and referenced real files
			return Promise.all(
				files.map(f => {
					return FileModel.findOne({_id: f._id}).remove().exec()
						.then(_ => {
							return createCorrectStrategy(fileStorageType).deleteFile(userId, f.flatFileName);
						});
				}));
		});
};

/** find all sub directories in deleted (virtual) directory with regex (also nested) **/
const deleteAllSubDirectories = (path) => {
	return DirectoryModel.find({path: {$regex : "^" + path}}).exec()
		.then(directories => {
			// delete virtual and referenced real files
			return Promise.all(
				directories.map(f => {
					return DirectoryModel.findOne({_id: f._id}).remove().exec();
				}));
		});
};

class FileStorageService {
	constructor() {
		this.docs = swaggerDocs.fileStorageService;
	}

	/**
	 * @param data, contains schoolId
	 * @returns {Promise}
	 */
	create(data, params) {
		return createCorrectStrategy(params.payload.fileStorageType).create(data.schoolId);
	}

	/**
	 * @returns {Promise}
	 * @param query contains the file path
	 * @param payload contains fileStorageType and userId and schoolId, set by middleware
	 */
	find({query, payload}) {
		let path = query.path;
		let userId = payload.userId;
		return filePermissionHelper.checkPermissions(userId, path)
			.then(_ => {
				// find all files and directories for given path
				let filePromise = FileModel.find({path: path}).exec();
				let directoryPromise = DirectoryModel.find({path: path}).exec();

				return Promise.all([filePromise, directoryPromise]).then(([files, directories]) => {
					return {
						files: files,
						directories: directories
					};
				});
			});
	}

	/**
	 * @param params, contains storageContext and fileName in query
	 * @returns {Promise}
	 */
	remove(id, params) {
		let path = params.query.path;
		let userId = params.payload.userId;
		return filePermissionHelper.checkPermissions(userId, path, ['can-write'])
			.then(_ => {
				// find file for path in proxy db, delete it and delete referenced file
				// todo: maybe refactor search so that I can put the file-proxy-id (@id) instead of the full path
				return FileModel.findOne({key: path}).exec()
					.then(file => {
						if (!file) return [];
						return FileModel.find({_id: file._id}).remove().exec()
							.then(_ => {
								return createCorrectStrategy(params.payload.fileStorageType).deleteFile(userId, file.flatFileName);
							});
					});
			});
	}

	/**
	 * @param id, the file-id in the proxy-db
	 * @param data, contains fileName, path and destination. Path and destination have to have a slash at the end!
	 */
	patch(id, data, params) {
		let fileName = data.fileName;
		let path = data.path;
		let destination = data.destination;

		if (!id || !fileName || !path || !destination) return Promise.reject(new errors.BadRequest('Missing parameters'));

		let userId = params.payload.userId;
		return filePermissionHelper.checkPermissions(userId, path + fileName)
			.then(_ => {
				// check destination permissions
				return filePermissionHelper.checkPermissions(userId, destination + fileName)
					.then(_ => {
						// patch file direction in proxy db
						return FileModel.update({_id: id,}, {
							$set: {
								key: destination + fileName,
								path: destination
							}
						}).exec();
					});
			});
	}
}

class SignedUrlService {
	constructor() {
		this.docs = swaggerDocs.signedUrlService;
	}

	/**
	 * @param path where to store the file
	 * @param fileType MIME type
	 * @param action the AWS action, e.g. putObject
	 * @returns {Promise}
	 */
	create({path, fileType, action}, params) {
		
		path = removeLeadingSlash(pathUtil.normalize(path)); // remove leading and double slashes
		let userId = params.payload.userId;
		let fileName = encodeURIComponent(pathUtil.basename(path));
		let dirName = pathUtil.dirname(path);
		
		// normalize utf-8 chars
		path = `${dirName}/${fileName}`;
		
		// todo: maybe refactor search so that I can put the file-proxy-id (@id) instead of the full path

		// all files are uploaded to a flat-storage architecture without real folders
		// converts the real filename to a unique one in flat-storage
		// if action = getObject, file should exist in proxy db
		let fileProxyPromise = action === 'getObject' ? FileModel.findOne({key: path}).exec() : Promise.resolve({});

		return fileProxyPromise.then(res => {
			if (!res) return;

			let flatFileName = res.flatFileName || generateFlatFileName(fileName);
			return filePermissionHelper.checkPermissions(userId, path).then(_ => {
				return createCorrectStrategy(params.payload.fileStorageType).generateSignedUrl(userId, flatFileName, fileType, action)
					.then(res => {
						return {
							url: res,
							header: {
								// add meta data for later using
								"Content-Type": fileType,
								"x-amz-meta-path": dirName,
								"x-amz-meta-name": encodeURIComponent(fileName),
								"x-amz-meta-flat-name": flatFileName,
								"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"
							}
						};
					});
			});
		});
	}
}

class DirectoryService {
	constructor() {
		this.docs = swaggerDocs.directoryService;
	}

	/**
	 * @param data, contains path
	 * @returns {Promise}
	 */
	create(data, params) {
		let userId = params.payload.userId;
		let path = data.path;
		let fileName = pathUtil.basename(path);
		let dirName = pathUtil.dirname(path) + "/";

		return filePermissionHelper.checkPermissions(userId, path)
			.then(_ => {
				// create db entry for new directory
				return DirectoryModel.create({
					key: path,
					name: fileName,
					path: dirName
				});
			});
	}

	/**
	 * @param params, {
			storageContext,
			dirName
		}
	 * @returns {Promise}
	 */
	remove(id, params) {
		let path = params.query.path;
		let userId = params.payload.userId;
		return filePermissionHelper.checkPermissions(userId, path, ['can-write'])
			.then(_ => {
				// find directory and delete it
				return DirectoryModel.findOne({key: path}).exec()
					.then(directory => {
						if (!directory) return [];
						return DirectoryModel.find({_id: directory._id}).remove().exec()
							.then(_ => {
								path = directory.key + "/";
								// delete all files and directories in the deleted directory
								let filesDeletePromise = deleteAllFilesInDirectory(path, params.payload.fileStorageType, userId);
								let directoriesDeletePromise = deleteAllSubDirectories(path);
								return Promise.all([filesDeletePromise, directoriesDeletePromise]);
							});
					});
			});
	}
}

class FileTotalSizeService {

	/**
	 * @returns total file size and amount of files
	 * @param query currently not needed
	 * @param payload contains fileStorageType and userId and schoolId, set by middleware
	 */
	find({query, payload}) {
		let sum = 0;
		return FileModel.find({schoolId: payload.schoolId}).exec()
			.then(files => {
				files.map(file => {
					sum += file.size;
				});

				return {total: files.length, totalSize: sum};
		});
	}
}

class CopyService {
	/**
	 * @param fileData, json parsed fileData
	 * @returns {Promise}
	 */
	patch(id, unknown, params) {
		let oldPath = params.query.oldPath;
		let newPath = params.query.newPath;
		let filename = params.query.filename;
		let userId = params.account.userId;
		
		if (!id || !oldPath || !newPath || !filename || !userId) {
			return Promise.reject(new errors.BadRequest('Missing parameters'));
		}
		
		// check source
		return filePermissionHelper.checkPermissions(userId, oldPath)
			.then(_ => {
				// check destination permissions
				return filePermissionHelper.checkPermissions(userId, newPath)
					.then(_ => {
						return Promise.all([
							// patch file direction in proxy db
							FileModel.update({_id: id,}, {
								$set: {
									key: newPath + filename,
									path: newPath
								}
							}).exec()
						], [
							// copy aws file
							createCorrectStrategy(params.payload.fileStorageType).copyFile(userId, params.query)
						]);
					});
			});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/directories', new DirectoryService());
	app.use('/fileStorage/signedUrl', new SignedUrlService());
	app.use('/fileStorage/total', new FileTotalSizeService());
	app.use('/fileStorage/copy', new CopyService());
	app.use('/fileStorage', new FileStorageService());

	// Get our initialize service to that we can bind hooks
	const fileStorageService = app.service('/fileStorage');
	const signedUrlService = app.service('/fileStorage/signedUrl');
	const directoryService = app.service('/fileStorage/directories');
	const fileTotalSizeService = app.service('/fileStorage/total');
	const copyService = app.service('/fileStorage/copy');

	// Set up our before hooks
	fileStorageService.before(hooks.before);
	signedUrlService.before(hooks.before);
	directoryService.before(hooks.before);
	fileTotalSizeService.before(hooks.before);
	copyService.before(hooks.before);

	// Set up our after hooks
	fileStorageService.after(hooks.after);
	signedUrlService.after(hooks.after);
	directoryService.after(hooks.after);
	fileTotalSizeService.after(hooks.after);
	copyService.after(hooks.after);
};
