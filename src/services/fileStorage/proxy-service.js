const fs = require('fs');
const logger = require('winston');
const rp = require('request-promise-native');
const { Forbidden, BadRequest, NotFound } = require('@feathersjs/errors');

const hooks = require('./hooks');
const AWSStrategy = require('./strategies/awsS3');
const swaggerDocs = require('./docs/');
const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
} = require('./utils/filePermissionHelper');
const { returnFileType, generateFileNameSuffix: generateFlatFileName } = require('./utils/filePathHelper');
const { FileModel } = require('./model');
const RoleModel = require('../role/model');
const { courseModel } = require('../user-group/model');
const { teamsModel } = require('../teams/model');
const { sortRoles } = require('../role/utils/rolesHelper');
const { userModel } = require('../user/model');

const strategies = {
	awsS3: AWSStrategy,
};

const createCorrectStrategy = (fileStorageType) => {
	const Strategy = strategies[fileStorageType];
	if (!Strategy) throw new BadRequest('No file storage provided for this school');
	return new Strategy();
};

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
	return obj;
};

const fileStorageService = {
	docs: swaggerDocs.fileStorageService,

	/**
     * @param data, file data
     * @param params,
     * @returns {Promise}
     */
	async create(data, params) {
		const { payload: { userId } } = params;
		const { owner, parent, studentCanEdit } = data;
		const permissions = [{
			refId: userId,
			refPermModel: 'user',
			write: true,
			read: true,
			create: true,
			delete: true,
		}];
		const setRefId = (perm) => {
			if (!perm.refId) {
				perm.refId = perm._id;
			}
			return perm;
		};

		let { permissions: sendPermissions } = data;
		let isCourse = true;

		if (owner) {
			isCourse = Boolean(await courseModel.findOne({ _id: owner }).exec());
		}

		if (isCourse) {
			const { _id: studentRoleId } = await RoleModel.findOne({ name: 'student' }).exec();
			const { _id: teacherRoleId } = await RoleModel.findOne({ name: 'teacher' }).exec();

			permissions.push({
				refId: studentRoleId,
				refPermModel: 'role',
				write: Boolean(studentCanEdit),
				read: true, // students can always read course files
				create: false,
				delete: false,
			});

			permissions.push({
				refId: teacherRoleId,
				refPermModel: 'role',
				write: true,
				read: true,
				create: false,
				delete: false,
			});
		}
		// eslint-disable-line no-nested-ternary
		const refOwnerModel = owner ? (isCourse ? 'course' : 'teams') : 'user';

		if (!sendPermissions && refOwnerModel === 'teams') {
			const teamObject = await teamsModel.findOne({ _id: owner }).lean().exec();
			const teamRoles = await RoleModel.find({ name: /^team/ }).lean().exec();
			const { filePermission: defaultPermissions } = teamObject;

			sendPermissions = teamRoles.map(({ _id: roleId }) => {
				const defaultPerm = defaultPermissions.find(({ refId }) => roleId.equals(refId));

				return defaultPerm || {
					refId: roleId,
					refPermModel: 'role',
					write: true,
					read: true,
					create: true,
					delete: true,
				};
			});
		} else {
			sendPermissions = [];
		}

		const props = sanitizeObj(Object.assign(data, {
			isDirectory: false,
			owner: owner || userId,
			parent,
			refOwnerModel,
			permissions: [...permissions, ...sendPermissions].map(setRefId),
			storageFileName: decodeURIComponent(data.storageFileName),
		}));

		// create db entry for new file
		// check for create permissions on parent
		if (parent) {
			return canCreate(userId, parent)
				.then(() => FileModel.findOne(props).exec().then(
					modelData => (modelData ? Promise.resolve(modelData) : FileModel.create(props)),
				))
				.catch((e) => {
					logger.error(e);
					return new Forbidden();
				});
		}

		return FileModel.findOne(props).exec().then(
			modelData => (modelData ? Promise.resolve(modelData) : FileModel.create(props)),
		);
	},

	/**
	 * @param query contains the owner id and parent id
	 * @param payload contains userId, set by middleware
	 * @returns { Promise }
	 */
	find({ query, payload }) {
		const { owner, parent } = query;
		const { userId } = payload;
		const parentPromise = parent ? canRead(userId, parent) : Promise.resolve();

		return parentPromise
			.then(() => FileModel.find({ owner, parent: parent || { $exists: false } }).exec())
			.then((files) => {
				const permissionPromises = files.map(
					f => canRead(userId, f)
						.then(() => f)
						.catch(() => undefined),
				);
				return Promise.all(permissionPromises);
			})
			.then((allowedFiles) => {
				const files = allowedFiles.filter(f => f);
				if (!files.length) {
					return new Forbidden();
				}

				return files;
			})
			.catch((e) => {
				logger.error(e);
				return Promise.reject(new Forbidden());
			});
	},

	/**
	 * @param id, Object-ID of file to be removed (optional)
	 * @param requestData, contains query parameters and userId/storageType set by middleware
	 * @returns {Promise}
	 */
	remove(id, { query, payload }) {
		const { userId, fileStorageType } = payload;
		const { _id = id } = query;
		const fileInstance = FileModel.findOne({ _id });

		return canDelete(userId, _id)
			.then(() => fileInstance.exec())
			.then((file) => {
				if (!file) {
					return new NotFound();
				}

				return createCorrectStrategy(fileStorageType).deleteFile(userId, file.storageFileName);
			})
			.then(() => fileInstance.remove().exec())
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
	/**
	 * Move file from one parent to another
	 * @param _id, Object-ID of file to be patched
	 * @param data, contains destination parent Object-ID
	 * @param params contains payload with userId, set by middleware
	 * @returns {Promise}
	 */
	async patch(_id, data, params) {
		const { payload: { userId } } = params;
		const { parent } = data;
		const update = { $set: {} };
		const fileObject = await FileModel.findOne({ _id: parent }).exec();
		const teamObject = await teamsModel.findOne({ _id: parent }).exec();

		const permissionPromise = () => {
			if (fileObject) {
				return canWrite(userId, parent);
			}

			if (teamObject) {
				return new Promise((resolve, reject) => {
					const teamMember = teamObject.userIds.find(
						u => u.userId.toString() === userId.toString(),
					);
					if (teamMember) {
						return resolve();
					}
					return reject();
				});
			}

			return Promise.resolve();
		};

		if (fileObject) {
			update.$set = {
				parent,
				owner: fileObject.owner,
				refOwnerModel: fileObject.refOwnerModel,
			};
		} else if (parent === userId.toString()) {
			update.$set = {
				owner: userId,
				refOwnerModel: 'user',
			};
			update.$unset = { parent: '' };
		} else {
			update.$set = {
				owner: parent,
				refOwnerModel: teamObject ? 'teams' : 'course',
			};
			update.$unset = { parent: '' };
		}

		return permissionPromise()
			.then(() => FileModel.update({ _id }, update).exec())
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
};

const signedUrlService = {
	docs: swaggerDocs.signedUrlService,
	/**
     * @param path where to store the file
     * @param fileType MIME type
     * @param action the AWS action, e.g. putObject
     * @returns {Promise}
     */
	create({ parent, filename, fileType }, params) {
		const { payload: { userId } } = params;
		const strategy = createCorrectStrategy(params.payload.fileStorageType);
		const flatFileName = generateFlatFileName(filename);

		const parentPromise = parent
			? FileModel.findOne({ parent, name: filename }).exec()
			: Promise.resolve({});

		const fileRegexCheck = fileName => [
			/^[dD]esktop\.ini$/,
			/^ehthumbs_vista\.db$/,
			/^ehthumbs\.db$/,
			/^Thumbs\.db$/,
			/^\.com\.apple\.timemachine\.donotpresent$/,
			/^\.VolumeIcon\.icns$/,
			/^\.Trashes$/,
			/^\.TemporaryItems$/,
			/^\.Spotlight-V100$/,
			/^\.fseventsd$/,
			/^\.DocumentRevisions-V100$/,
			/^\.LSOverride$/,
			/^\.AppleDouble$/,
			/^\.DS_Store$/,
			/^.*\*$/,
			/^.*\.lnk$/,
			/^.*\.msp$/,
			/^.*\.msm$/,
			/^.*\.msi$/,
			/^.*\.cab$/,
			/^.*\.msi$/,
			/^.*\.stackdump$/,
			/^\.nfs.*$/,
			/^\.Trash-.*$/,
			/^\.fuse_hidden.*$/,
			/^\..*$/,
		].some(rx => rx.test(fileName));

		return parentPromise
			.then(() => (parent ? canCreate(userId, parent) : Promise.resolve({})))
			.then(() => {
				if (fileRegexCheck(flatFileName)) {
					throw new BadRequest(`Die Datei '${flatFileName}' ist nicht erlaubt!`);
				}

				return strategy.generateSignedUrl({ userId, flatFileName, fileType });
			})
			.then((res) => {
				const header = {
					// add meta data for later using
					'Content-Type': fileType,
					'x-amz-meta-name': encodeURIComponent(filename),
					'x-amz-meta-flat-name': encodeURIComponent(flatFileName),
					'x-amz-meta-thumbnail': 'https://schulcloud.org/images/login-right.png',
				};
				return {
					url: res,
					header,
				};
			})
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},

	async find({ query, payload }) {
		const { file, download } = query;
		const { userId } = payload;
		const strategy = createCorrectStrategy(payload.fileStorageType);
		const fileObject = await FileModel.findOne({ _id: file }).exec();

		if (!fileObject) {
			throw new NotFound('File seems not to be there.');
		}

		const creatorId = fileObject.permissions[0].refPermModel !== 'user' ? userId : fileObject.permissions[0].refId;

		return canRead(userId, file)
			.then(() => strategy.getSignedUrl({
				userId: creatorId,
				flatFileName: fileObject.storageFileName,
				localFileName: fileObject.name,
				download,
			}))
			.then(res => ({
				url: res,
			}))
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},

	async patch(id, data, params) {
		const { payload } = params;
		const { userId } = payload;
		const strategy = createCorrectStrategy(payload.fileStorageType);
		const fileObject = await FileModel.findOne({ _id: id }).exec();

		if (!fileObject) {
			throw new NotFound('File seems not to be there.');
		}

		const creatorId = fileObject.permissions[0].refPermModel !== 'user' ? userId : fileObject.permissions[0].refId;

		return canRead(userId, id)
			.then(() => strategy.getSignedUrl({
				userId: creatorId,
				flatFileName: fileObject.storageFileName,
				action: 'putObject',
			}))
			.then(res => ({
				url: res,
			}))
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
};

const directoryService = {

	docs: swaggerDocs.directoryService,

	/**
	 * @param data, directory data containing name, parent, owner
	 * @param params,
	 * @returns {Promise}
	 */
	async create(data, params) {
		const { payload: { userId } } = params;
		const { owner, parent } = data;
		const permissions = [{
			refId: userId,
			refPermModel: 'user',
			write: true,
			read: true,
			create: true,
			delete: true,
		}];

		const setRefId = (perm) => {
			if (!perm.refId) {
				perm.refId = perm._id;
			}
			return perm;
		};

		const directoryExists = () => FileModel.findOne({
			owner,
			parent,
			isDirectory: true,
			name: data.name,
		}).exec();

		const folderRegexCheck = fileName => [
			/^[a-zA-Z]{1}_drive$/,
			/^Windows$/,
			/^\$.*$/,
			/^\..*$/,
			/^Temporary Items$/,
			/^Network Trash Folder$/,
			/^ *$/,
		].some(rx => rx.test(fileName));

		if (folderRegexCheck(data.name)) {
			throw new BadRequest(`Der Ordner '${data.name}' ist nicht erlaubt!`);
		}

		let { permissions: sendPermissions } = data;
		let isCourse = true;

		if (owner) {
			isCourse = Boolean(await courseModel.findOne({ _id: owner }).exec());
		}

		if (isCourse) {
			const { _id: studentRoleId } = await RoleModel.findOne({ name: 'student' }).exec();

			permissions.push({
				refId: studentRoleId,
				refPermModel: 'role',
				write: false,
				read: true, // students can always read course files
				create: true,
				delete: false,
			});
		}

		if (!sendPermissions) {
			const teamObject = await teamsModel.findOne({ _id: owner }).lean().exec();
			sendPermissions = teamObject ? teamObject.filePermission : [];
		}

		const props = sanitizeObj(Object.assign(data, {
			isDirectory: true,
			owner: owner || userId,
			parent,
			refOwnerModel: owner ? (isCourse ? 'course' : 'teams') : 'user',
			permissions: [...permissions, ...sendPermissions].map(setRefId),
		}));

		// create db entry for new directory
		// check for create permissions if it is a subdirectory

		if (parent) {
			return canCreate(userId, parent)
				.then(() => directoryExists().then(
					data_ => (data_ ? Promise.resolve(data_) : FileModel.create(props)),
				)).catch((e) => {
					logger.error(e);
					return new Forbidden();
				});
		}

		return directoryExists().then(
			data_ => (data_ ? Promise.resolve(data_) : FileModel.create(props)),
		);
	},

	/**
     * @returns {Promise}
     * @param query contains the ID of parent folder (optional)
     * @param payload contains userId set by middleware
     */
	find({ query, payload }) {
		const { parent } = query;
		const { userId } = payload;

		const params = sanitizeObj({
			isDirectory: true,
			parent,
		});

		return FileModel.find(params).exec()
			.then((files) => {
				const permissionPromises = files.map(
					f => canRead(userId, f)
						.then(() => f)
						.catch(() => undefined),
				);
				return Promise.all(permissionPromises);
			})
			.then((allowedFiles) => {
				const files = allowedFiles.filter(f => f);
				return files.length ? files : new NotFound();
			});
	},

	/**
     * @param id, params
     * @returns {Promise}
     */
	remove(_, { query, payload }) {
		const { userId } = payload;
		const { _id } = query;
		const fileInstance = FileModel.findOne({ _id });

		return canDelete(userId, _id)
			.then(() => fileInstance.exec())
			.then((file) => {
				if (!file) return Promise.resolve({});
				return FileModel.find({ parent: _id }).remove().exec();
			})
			.then(() => fileInstance.remove().exec())
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
};

const renameService = {

	docs: swaggerDocs.renameService,

	/**
     * @param data, contains id of fileObject and newName
     * @returns {Promise}
     */
	create(data, params) {
		const { payload: { userId } } = params;
		const { newName, id } = data;

		if (!id || !newName) return Promise.reject(new BadRequest('Missing parameters'));

		const _id = id;

		return canWrite(userId, _id)
			.then(() => FileModel.findOne({ _id }).exec())
			.then((obj) => {
				if (!obj) return Promise.reject(new NotFound('The given directory/file was not found!'));
				return FileModel.update({ _id }, { name: newName }).exec();
			})
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
};

const fileTotalSizeService = {

	docs: swaggerDocs.fileTotalSizeService,

	/**
     * @returns total file size and amount of files
	 * FIX-ME:
	 * - Check if user in payload is administrator
     */
	find() {
		return FileModel.find({}).exec()
			.then(files => ({
				total: files.length,
				totalSize: files.reduce((sum, file) => sum + file.size, 0),
			}));
	},
};

const bucketService = {
	docs: swaggerDocs.bucketService,

	/**
     * @param data, contains schoolId
	 * FIX-ME:
	 * - Check if user in payload is administrator
     * @returns {Promise}
     */
	create(data, params) {
		const { schoolId } = data;
		const { payload: { fileStorageType } } = params;

		return createCorrectStrategy(fileStorageType).create(schoolId);
	},
};

const copyService = {

	docs: swaggerDocs.copyService,

	/**
     * @param data, contains file-Id and new parent
     * @returns {Promise}
     */
	create(data, params) {
		const { file, parent } = data;
		const { payload: { userId } } = params;
		const strategy = createCorrectStrategy(params.payload.fileStorageType);

		if (!file || !parent) {
			return Promise.reject(new BadRequest('Missing parameters'));
		}

		// first check if given file is valid
		return FileModel.findOne({ _id: file }).exec()
			.then((fileObject) => {
				if (!file) throw new NotFound('The file was not found!');

				// check that there's no file on 'newPath', otherwise change name of file
				return Promise.all([
					FileModel.findOne({ parent, name: file.name }).exec(),
					fileObject,
				]);
			})
			.then(([existingFile, fileObject]) => {
				const newFile = {
					parent,
				};

				if (existingFile) {
					const [ext, name] = file.name.split('.').reverse();
					newFile.name = `${name}_${Date.now()}.${ext}`;
				}

				return Promise.all([
					newFile,
					fileObject,
					canRead(userId, file),
					canWrite(userId, parent),
				]);
			})
			.then(([newFile, fileObject]) => {
				// copy file on external storage
				newFile.storageFileName = generateFlatFileName(newFile.name);

				return Promise.all([
					newFile,
					fileObject,
					strategy.copyFile(userId, fileObject.storageFileName, newFile.storageFileName),
				]);
			})
			.then(([newFile, fileObject]) => FileModel.create({
				...fileObject,
				...newFile,
			}));
	},
};

const newFileService = {

	docs: swaggerDocs.newFileService,

	/**
     * @param data, contains path, key, name
     * @returns new File
     */
	create(data, params) {
		const {
			name, owner, parent, studentCanEdit,
		} = data;
		const fType = name.split('.').pop();
		const buffer = fs.readFileSync(`src/services/fileStorage/resources/fake.${fType}`);
		const flatFileName = generateFlatFileName(name);

		return signedUrlService.create({
			fileType: returnFileType(name),
			parent,
			filename: name,
		}, params)
			.then(signedUrl => rp({
				method: 'PUT',
				uri: signedUrl.url,
				body: buffer,
			}))
			.then(() => fileStorageService.create({
				size: buffer.length,
				storageFileName: flatFileName,
				type: returnFileType(name),
				thumbnail: 'https://schulcloud.org/images/login-right.png',
				name,
				owner,
				parent,
				studentCanEdit,
			}, params));
	},
};

const filePermissionService = {

	docs: swaggerDocs.permissionService,

	/**
	* @param _id, Object-ID of file obejct to be altered
	* @param data, contains new permissions
	* @returns {Promise}
	*/
	async patch(_id, data, params) {
		const { payload: { userId } } = params;
		const { permissions: commitedPerms } = data;

		const permissionPromises = commitedPerms.map(({ refId }) => Promise.all([
			RoleModel.findOne({ _id: refId }).lean().exec(),
			userModel.findOne({ _id: refId }).lean().exec(),
		])
			.then(([role, user]) => {
				if (role) {
					return 'role';
				}
				return user ? 'user' : '';
			}));

		return canWrite(userId, _id)
			.then(() => Promise.all([
				FileModel.findOne({ _id }).exec(),
				permissionPromises,
			]))
			.then(([fileObject, refModels]) => {
				if (!fileObject) {
					return Promise.reject(new NotFound(`File with ID ${_id} not found`));
				}

				let { permissions } = fileObject;

				permissions = permissions.map((perm) => {
					const update = commitedPerms.find(({ refId }) => perm.refId.equals(refId));

					if (update) {
						const { write, read, create } = update;

						return Object.assign(perm, sanitizeObj({
							write,
							read,
							create,
							delete: update.delete,
						}));
					}

					return perm;
				});

				permissions = [
					...permissions,
					...commitedPerms
						.filter(({ refId }) => permissions.findIndex(({ refId: id }) => id.equals(refId)) === -1)
						.map((perm, idx) => {
							const {
								write,
								read,
								create,
								refId,
							} = perm;

							return sanitizeObj({
								refId,
								refOwnerModel: refModels[idx],
								write,
								read,
								create,
								delete: perm.delete,
							});
						}),
				];

				return FileModel.update({ _id }, {
					$set: { permissions },
				}).exec();
			})
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
	/**
     * Returns the permissions of a file filtered by owner model
     * and permissions based on the role of the user
     * @returns {Promise}
     * @param query contains the file id
     * @param payload contains userId
     */
	async find({ query, payload }) {
		const { file: fileId } = query;
		const { userId } = payload;
		const fileObj = await FileModel.findOne({ _id: fileId }).populate('owner').lean().exec();
		const userObject = await userModel.findOne({ _id: userId }).populate('roles').lean().exec();

		const { refOwnerModel, owner } = fileObj;
		const rolePermissions = fileObj.permissions.filter(({ refPermModel }) => refPermModel === 'role');
		const rolePromises = rolePermissions
			.map(({ refId }) => RoleModel.findOne({ _id: refId }).lean().exec());
		const isFileCreator = fileObj.permissions[0].refId.toString() === userId.toString();

		const actionMap = {
			user: () => {
				const userPermission = fileObj.permissions
					.filter(({ refPermModel }) => refPermModel === 'user')
					.filter(({ refId }) => !refId.equals(userId));

				return Promise.all(
					userPermission.map(({ refId }) => userModel.findOne({ _id: refId }).exec()),
				)
					.then((result) => {
						const users = result ? result.filter(u => u) : [];
						if (users.length) {
							return userPermission.map((perm) => {
								const { firstName, lastName, _id } = users
									.find(({ _id: id }) => id.equals(perm.refId));

								return {
									refId: _id,
									name: `${firstName} ${lastName}`,
									...perm,
								};
							});
						}

						return Promise.resolve([]);
					});
			},
			course() {
				const isStudent = userObject.roles.some(({ name }) => name === 'student');

				return Promise.all(rolePromises)
					.then(roles => rolePermissions
						.map((perm) => {
							const { name } = roles.find(({ _id }) => _id.equals(perm.refId));
							const { read, write, refId } = perm;

							const nameMap = {
								student() {
									return isStudent ? {
										read,
										write: isFileCreator ? write : undefined,
									} : { write, read };
								},
								teacher() {
									return isStudent ? {} : {
										read,
										write: isFileCreator ? write : undefined,
									};
								},
							};

							return {
								...sanitizeObj(nameMap[name]()),
								refId,
								name,
							};
						})
						.filter(({ name }) => {
							if (isStudent) {
								return name === 'student';
							}
							return true;
						}));
			},
			teams() {
				const { role: userRole } = owner.userIds.find(u => userId.equals(u.userId));

				return Promise.all(rolePromises)
					.then(sortRoles)
					.then((sortedRoles) => {
						const userPos = sortedRoles
							.findIndex(roles => roles.findIndex(({ _id }) => _id.equals(userRole)) > -1);

						return sortedRoles
							.reduce((flat, roles, index) => {
								if (index <= userPos) {
									return [
										...flat,
										...roles.map(({ name, _id }) => ({
											name,
											_id,
											sibling: index === userPos,
										})),
									];
								}

								return flat;
							}, [])
							.map(({ _id, name, sibling }) => {
								const { read, write, refId } = rolePermissions
									.find(({ refId: id }) => id.equals(_id));
								const reWrite = isFileCreator ? write : undefined;

								const permissions = {
									read: sibling ? undefined : read,
									write: sibling ? reWrite : write,
								};

								return {
									refId,
									name,
									...sanitizeObj(permissions),
								};
							});
					});
			},
		};

		return canRead(userId, fileId)
			.then(actionMap[refOwnerModel])
			.catch((e) => {
				logger.error(e);
				return new Forbidden();
			});
	},
};

module.exports = function proxyService() {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/fileStorage/directories', directoryService);
	app.use('/fileStorage/directories/rename', renameService);
	app.use('/fileStorage/rename', renameService);
	app.use('/fileStorage/signedUrl', signedUrlService);
	app.use('/fileStorage/bucket', bucketService);
	app.use('/fileStorage/total', fileTotalSizeService);
	app.use('/fileStorage/copy', copyService);
	app.use('/fileStorage/permission', filePermissionService);
	app.use('/fileStorage/files/new', newFileService);
	app.use('/fileStorage', fileStorageService);

	[
		'/fileStorage',
		'/fileStorage/signedUrl',
		'/fileStorage/bucket',
		'/fileStorage/directories',
		'/fileStorage/directories/rename',
		'/fileStorage/rename',
		'/fileStorage/total',
		'/fileStorage/copy',
		'/fileStorage/files/new',
		'/fileStorage/permission',
	].forEach((path) => {
		// Get our initialize service to that we can bind hooks
		const service = app.service(path);
		service.hooks(hooks);
	});
};
