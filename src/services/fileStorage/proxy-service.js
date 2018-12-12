'use strict';
const pathUtil = require('path').posix;
const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const errors = require('feathers-errors');
const swaggerDocs = require('./docs/');
const filePermissionHelper = require('./utils/filePermissionHelper');
const removeLeadingSlash = require('./utils/filePathHelper').removeLeadingSlash;
const generateFlatFileName = require('./utils/filePathHelper').generateFileNameSuffix;
const returnFileType = require('./utils/filePathHelper').returnFileType;
const FileModel = require('./model').fileModel;
const DirectoryModel = require('./model').directoryModel;
const LessonModel = require('../lesson/model');
const rp = require('request-promise-native');
const fs = require('fs');

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
	return FileModel.find({path: {$regex: "^" + path}}).exec()
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
	return DirectoryModel.find({path: {$regex: "^" + path}}).exec()
		.then(directories => {
			// delete virtual and referenced real files
			return Promise.all(
				directories.map(f => {
					return DirectoryModel.findOne({_id: f._id}).remove().exec();
				}));
		});
};

/** find all objects for given @model in renamed (virtual) directory with regex (also nested) and changes its path and key */
const relinkAllObjectsInDirectory = (oldPath, newPath, model) => {
	return model.find({path: {$regex: "^" + oldPath}}).exec()
		.then(objects => {
			return Promise.all(
				objects.map(o => {
					let oldKey = o.key;
					// just changed that substring of path which ends on the renamed directory's old path (because of deeper nested files)
					o.path = newPath + "/" + o.path.substring(oldPath.length + 1);
					o.key = o.path + o.name;
					return model.update({_id: o._id}, o).exec().then(_ => {
						// also relink object (actually files) which are included in lessons
						return relinkFileInLessons(oldKey, o.key);
					});
				}));
		});
};

/** modifies the file-link in all corresponding lessons */
const relinkFileInLessons = (oldPath, newPath) => {
	return LessonModel.find({"contents.content.text": {$regex: oldPath, $options: 'i'}}).then(lessons => {
		if (lessons && lessons.length > 0) {
			return Promise.all(lessons.map(l => {
				l.contents.map(content => {
					if (content.component === "text" && content.content.text) {
						content.content.text = content.content.text.replace(new RegExp(oldPath, "g"), newPath);
					}
				});

				return LessonModel.update({_id: l._id}, l).exec();
			}));
		}
		return Promise.resolve({});
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
	 * @param flatFileName a pregenerated file name for the flat storage
	 * @returns {Promise}
	 */

	create({path, fileType, action, download, flatFileName}, params) {
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
    let fileProxyPromise = action === 'getObject' ? FileModel.findOne({key: path}).exec() : Promise.resolve({flatFileName});
    
		return fileProxyPromise.then(res => {
			if (!res) return;

			let flatFileName = res.flatFileName || generateFlatFileName(fileName);
			return filePermissionHelper.checkPermissions(userId, path).then(p => {

				// set external schoolId if file is shared
				let externalSchoolId;
				if (p.permission === 'shared') externalSchoolId = res.schoolId;

				let header =  {							
					// add meta data for later using
					"Content-Type": fileType,
					"x-amz-meta-path": dirName,
					"x-amz-meta-name": fileName,
					"x-amz-meta-flat-name": flatFileName,
					"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"				
				};

				return createCorrectStrategy(params.payload.fileStorageType).generateSignedUrl(userId, flatFileName, fileType, action, externalSchoolId, download)
					.then(res => {
						return {
							url: res,
							header: header
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

class FileRenameService {
	constructor() {
		this.docs = swaggerDocs.fileRenameService;
	}

	/**
	 * @param data, contains path, newName
	 * @returns {Promise}
	 */
	create(data, params) {
		let userId = params.payload.userId;
		let path = data.path;
		let newName = data.newName;

		if (!path || !newName) return Promise.reject(new errors.BadRequest('Missing parameters'));

		return filePermissionHelper.checkPermissions(userId, path)
			.then(_ => {
				// find file and rename it
				return FileModel.findOne({key: path}).exec()
					.then(file => {
						if (!file) return Promise.reject(new errors.NotFound('The given file was not found!'));

						file.name = newName;
						file.key = file.path + newName;

						return FileModel.update({_id: file._id}, file).exec()
							.then(_ => {
								// modify lessons which include the given file
								return relinkFileInLessons(path, file.key);
							});
					});
			});
	}
}

class DirectoryRenameService {
	constructor() {
		this.docs = swaggerDocs.directoryRenameService;
	}

	/**
	 * @param data, contains path, newName
	 * @returns {Promise}
	 */
	create(data, params) {
		let userId = params.payload.userId;
		let path = data.path;
		let newName = data.newName;

		if (!path || !newName) return Promise.reject(new errors.BadRequest('Missing parameters'));

		return filePermissionHelper.checkPermissions(userId, path)
			.then(_ => {
				// find directory and rename it
				return DirectoryModel.findOne({key: path}).exec()
					.then(directory => {
						if (!directory) return Promise.reject(new errors.NotFound('The given directory was not found!'));

						directory.name = newName;
						directory.key = directory.path + newName;

						return DirectoryModel.update({_id: directory._id}, directory).exec()
							.then(_ => {
								// change paths and keys of all files and directories in the renamed directory
								let filesRenamePromise = relinkAllObjectsInDirectory(path, directory.key, FileModel);
								let directoriesRenamePromise = relinkAllObjectsInDirectory(path, directory.key, DirectoryModel);
								return Promise.all([filesRenamePromise, directoriesRenamePromise]);
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

	constructor() {
		this.docs = swaggerDocs.copyService;
	}

	/**
	 * @param data, contains oldPath, newPath and externalSchoolId (optional).
	 * @returns {Promise}
	 */
	create(data, params) {
		let {fileName, oldPath, newPath, externalSchoolId} = data;
		let userId = params.account.userId;

		if (!oldPath || !fileName || !newPath || !userId) {
			return Promise.reject(new errors.BadRequest('Missing parameters'));
		}

		// first check if given file is valid
		return FileModel.findOne({key: oldPath + fileName}).exec()
			.then(file => {
				if (!file) throw new errors.NotFound("The file was not found!");

				// check that there's no file on 'newPath', otherwise change name of file
				return FileModel.findOne({key: newPath + fileName}).exec()
					.then(newFile => {
						let newFileName = fileName;
						if (newFile) {
							let name = fileName.substring(0, fileName.lastIndexOf('.'));
							let extension = fileName.split('.').pop();
							newFileName = `${name}_${Date.now()}.${extension}`;
						}

						// check permissions for oldPath and newPath
						let oldPathPromise = filePermissionHelper.checkPermissions(userId, oldPath + fileName);
						let newPathPromise = filePermissionHelper.checkPermissions(userId, newPath + newFileName);

						return Promise.all([oldPathPromise, newPathPromise]).then(_ => {

							// copy file on external storage
							let newFlatFileName = generateFlatFileName(newFileName);
							return createCorrectStrategy(params.payload.fileStorageType).copyFile(userId, file.flatFileName, newFlatFileName, externalSchoolId).then(_ => {

								// create proxy object from copied;
								let newFileObject = {
									key: newPath + newFileName,
									path: newPath,
									name: decodeURIComponent(newFileName),
									type: file.type,
									size: file.size,
									flatFileName: newFlatFileName,
									thumbnail: file.thumbnail,
									schoolId: file.schoolId,
									permissions: file.permissions || []
								};

								return FileModel.create(newFileObject);
							});
						});
					});
			});
	}
}

class NewFileService {
	constructor(app) {
		this.app = app;
	}

	/**
	 * @param data, contains path, key, name
	 * @returns new File
	 */
	create(data, params) {
		const {path, name, key, studentCanEdit, schoolId} = data;

		let newKey = `${path}${encodeURIComponent(name)}`;

		let signedUrlService = this.app.service('fileStorage/signedUrl');
		let fType = name.split('.');
		fType = fType[fType.length - 1];
		let buffer = fs.readFileSync(`src/services/fileStorage/resources/fake.${fType}`);

		let flatFileName = generateFlatFileName(name);

		return signedUrlService.create({
			path: key,
			fileType: returnFileType(name),
			action: 'putObject',
			flatFileName: encodeURIComponent(flatFileName),
			userId: params.account.userId
		}).then(signedUrl => {
			let options = {
				method: 'PUT',
				uri: signedUrl.url,
				body: buffer
			};

			return rp(options).then(_ => {
				return FileModel.create({
					path,
					name,
					key: newKey,
					size: buffer.length,
					flatFileName: encodeURIComponent(flatFileName),
					type: returnFileType(name),
					thumbnail: 'https://schulcloud.org/images/login-right.png',
					studentCanEdit,
					schoolId
				})
					.then(_ => {
						return Promise.resolve();
					});
			});
		});
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/files/new', new NewFileService(app));
	app.use('/fileStorage/directories', new DirectoryService());
	app.use('/fileStorage/directories/rename', new DirectoryRenameService());
	app.use('/fileStorage/rename', new FileRenameService());
	app.use('/fileStorage/signedUrl', new SignedUrlService());
	app.use('/fileStorage/total', new FileTotalSizeService());
	app.use('/fileStorage/copy', new CopyService());
	app.use('/fileStorage', new FileStorageService());

	// Get our initialize service to that we can bind hooks
	const fileStorageService = app.service('/fileStorage');
	const signedUrlService = app.service('/fileStorage/signedUrl');
	const directoryService = app.service('/fileStorage/directories');
	const directoryRenameService = app.service('/fileStorage/directories/rename');
	const fileRenameService = app.service('/fileStorage/rename');
	const fileTotalSizeService = app.service('/fileStorage/total');
	const copyService = app.service('/fileStorage/copy');
	const newFileService = app.service('/fileStorage/files/new');

	// Set up our before hooks
	fileStorageService.before(hooks.before);
	signedUrlService.before(hooks.before);
	directoryService.before(hooks.before);
	directoryRenameService.before(hooks.before);
	fileRenameService.before(hooks.before);
	fileTotalSizeService.before(hooks.before);
	copyService.before(hooks.before);
	newFileService.before(hooks.before);

	// Set up our after hooks
	fileStorageService.after(hooks.after);
	signedUrlService.after(hooks.after);
	directoryService.after(hooks.after);
	directoryRenameService.after(hooks.after);
	fileRenameService.after(hooks.after);
	fileTotalSizeService.after(hooks.after);
	copyService.after(hooks.after);
	newFileService.before(hooks.after);
};
