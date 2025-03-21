const fs = require('fs');
const url = require('url');
const axios = require('axios');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { filesRepo } = require('../../components/fileStorage/repo');

const { Forbidden, NotFound, BadRequest, GeneralError } = require('../../errors');

const hooks = require('./hooks');
const swaggerDocs = require('./docs');

const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	returnFileType,
	generateFileNameSuffix,
	copyFile,
	createDefaultPermissions,
	createPermission,
} = require('./utils');
const { FileModel, SecurityCheckStatusTypes } = require('./model');
const { schoolModel } = require('../school/model');
const RoleModel = require('../role/model');
const { courseModel } = require('../user-group/model');
const { teamsModel } = require('../teams/model');
const { sortRoles } = require('../role/utils/rolesHelper');
const { userModel } = require('../user/model');
const logger = require('../../logger');
const { equal: equalIds } = require('../../helper/compare').ObjectId;
const { FILE_SECURITY_CHECK_MAX_FILE_SIZE, SECURITY_CHECK_SERVICE_PATH } = require('../../../config/globals');
const AWSS3Strategy = require('./strategies/awsS3');

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
	return obj;
};

const getStorageProviderIdAndBucket = async (userId, fileObject, strategy) => {
	let storageProviderId = fileObject.storageProviderId;
	let bucket = fileObject.bucket;

	if (!storageProviderId) {
		// deprecated: author check via file.permissions[0]?.refId is deprecated and will be removed in the next release
		const creatorId =
			fileObject.creator ||
			(fileObject.permissions[0]?.refPermModel !== 'user' ? userId : fileObject.permissions[0]?.refId);

		const creator = await userModel.findById(creatorId).exec();
		if (!creator || !creator.schoolId) {
			throw new NotFound('User not found');
		}

		const { schoolId } = creator;

		const school = await schoolModel
			.findOne({ _id: schoolId }, null, { readPreference: 'primary' }) // primary for afterhook in school.create
			.populate('storageProvider')
			.select(['storageProvider'])
			.lean()
			.exec();
		if (school === null) {
			throw new NotFound('School not found.');
		}

		storageProviderId = school.storageProvider;
		bucket = strategy.getBucket(schoolId);
	}

	return {
		storageProviderId,
		bucket,
	};
};

/**
 *
 * @param {File} file the file object
 * @param {ObjectId} user the file creator
 * @param {FileStorageStrategy} strategy the file storage strategy used
 * @returns {Promise} Promise that rejects with errors or resolves with no data otherwise
 */
const prepareSecurityCheck = async (file, userId, strategy) => {
	if (Configuration.get('ENABLE_FILE_SECURITY_CHECK') === true) {
		if (file.size > FILE_SECURITY_CHECK_MAX_FILE_SIZE) {
			return FileModel.updateOne(
				{ _id: file._id },
				{
					$set: {
						'securityCheck.status': SecurityCheckStatusTypes.WONTCHECK,
						'securityCheck.reason': `File is larger than ${FILE_SECURITY_CHECK_MAX_FILE_SIZE} bytes`,
					},
				}
			).exec();
		}
		const { storageProviderId, bucket } = await getStorageProviderIdAndBucket(userId, file);
		// create a temporary signed URL and provide it to the virus scan service
		return strategy
			.getSignedUrl({
				storageProviderId,
				bucket,
				flatFileName: file.storageFileName,
				localFileName: file.storageFileName,
				download: true,
			})
			.then((signedUrl) => {
				const params = {
					url: Configuration.get('FILE_SECURITY_CHECK_SERVICE_URI'),
					method: 'POST',
					auth: {
						username: Configuration.get('FILE_SECURITY_SERVICE_USERNAME'),
						password: Configuration.get('FILE_SECURITY_SERVICE_PASSWORD'),
					},
					data: {
						download_uri: signedUrl,
						callback_uri: url.resolve(
							Configuration.get('API_HOST'),
							`${SECURITY_CHECK_SERVICE_PATH}${file.securityCheck.requestToken}`
						),
					},
				};
				const send = axios(params);
				return send;
			});
	}
	return Promise.resolve();
};

/**
 * @param {*} owner
 * @returns 'user' || 'course' || 'teams'
 */
const getRefOwnerModel = async (owner) => {
	let refOwnerModel = 'user';

	if (owner) {
		const isCourse = Boolean(await courseModel.findOne({ _id: owner }).exec());
		refOwnerModel = isCourse ? 'course' : 'teams';
	}

	return refOwnerModel;
};

const fileStorageService = {
	docs: swaggerDocs.fileStorageService,
	Stategy: AWSS3Strategy,

	getStrategy() {
		return new this.Stategy();
	},
	/**
	 * @param data, file data
	 * @param params,
	 * @returns {Promise}
	 */
	async create(data, params) {
		const {
			payload: { userId: creatorId },
		} = params;
		const { owner, parent, studentCanEdit, permissions: sendPermissions = [], deletedAt } = data;

		if (deletedAt !== undefined) {
			// creation of deleted files should fail
			throw new BadRequest();
		}

		const refOwnerModel = await getRefOwnerModel(owner);

		const permissions = await createDefaultPermissions(creatorId, refOwnerModel, {
			studentCanEdit,
			sendPermissions,
			owner,
		}).catch((err) => {
			throw new GeneralError('Can not create default Permissions', err);
		});

		const fileOwner = owner || creatorId;

		const strategy = this.getStrategy();
		const creator = await userModel.findById(creatorId).lean().exec();
		const { schoolId } = creator;
		const bucket = strategy.getBucket(schoolId);
		const school = await schoolModel.findById(schoolId).lean().exec();
		const storageProviderId = school.storageProvider;

		const props = sanitizeObj(
			Object.assign(data, {
				isDirectory: false,
				owner: fileOwner,
				parent,
				refOwnerModel,
				permissions,
				creator: creatorId,
				storageFileName: decodeURIComponent(data.storageFileName),
				storageProviderId,
				bucket,
			})
		);

		const asyncErrorHandler = (err = {}) => {
			const message = err.message || 'Error during async file operation after upload.';
			logger.error({ message, stack: err.stack });
		};

		// create db entry for new file
		// check for create permissions on parent
		if (parent) {
			await canCreate(creatorId, parent);
		}

		let file = await FileModel.findOne(props).lean().exec();
		if (!file) file = await FileModel.create(props);

		prepareSecurityCheck(file, creatorId, strategy).catch(asyncErrorHandler);

		return file;
	},

	/**
	 * @param query contains the owner id and parent id
	 * @param payload contains userId, set by middleware
	 * @returns { Promise }
	 */
	find({ query, payload }) {
		const { owner, parent } = query;
		const { userId } = payload;
		const parentPromise = parent
			? canRead(userId, parent).catch(() => Promise.reject(new Forbidden()))
			: Promise.resolve();

		return parentPromise
			.then(() =>
				FileModel.find({ owner, parent: parent || { $exists: false } })
					.lean()
					.exec()
			)
			.then((files) =>
				Promise.all(
					files.map((f) =>
						canRead(userId, f)
							.then(() => f)
							.catch(() => undefined)
					)
				)
			)
			.then((allowedFiles) => allowedFiles.filter((f) => f))
			.catch((err) => Promise.reject(err));
	},

	/**
	 * @param id, Object-ID of file to be removed (optional)
	 * @param requestData, contains query parameters and userId/storageType set by middleware
	 * @returns {Promise}
	 */
	async remove(id, { query, payload }) {
		const { userId } = payload;
		const { _id = id } = query;

		// check file exists
		await filesRepo.getFileById(_id);
		// check permissions
		try {
			await canDelete(userId, _id);
		} catch (err) {
			throw new Forbidden();
		}
		// remove file for user
		await filesRepo.removeFileById(_id);
	},
	/**
	 * Move file from one parent to another
	 * @param _id, Object-ID of file to be patched
	 * @param data, contains destination parent Object-ID
	 * @param params contains payload with userId, set by middleware
	 * @returns {Promise}
	 */
	async patch(_id, data, params) {
		const {
			payload: { userId },
		} = params;
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
					const teamMember = teamObject.userIds.find((u) => equalIds(u.userId, userId));
					if (teamMember) {
						return resolve();
					}
					return reject(new Error());
				});
			}

			return Promise.reject();
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
			.catch((err) => new Forbidden(err));
	},
};

const signedUrlService = {
	docs: swaggerDocs.signedUrlService,
	Stategy: AWSS3Strategy,

	getStrategy() {
		return new this.Stategy();
	},

	fileRegexCheck(fileName) {
		return [
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
		].some((rx) => rx.test(fileName));
	},

	/**
	 * @param path where to store the file
	 * @param fileType MIME type
	 * @param action the AWS action, e.g. putObject
	 * @returns {Promise}
	 */
	create({ parent, filename, fileType, flatFileName: _flatFileName }, params) {
		const {
			payload: { userId },
		} = params;
		const flatFileName = _flatFileName || generateFileNameSuffix(filename);

		const parentPromise = parent ? FileModel.findOne({ parent, name: filename }).exec() : Promise.resolve({});

		const header = {
			name: encodeURIComponent(filename),
			'flat-name': encodeURIComponent(flatFileName),
			thumbnail: '',
		};

		return parentPromise
			.then(() => (parent ? canCreate(userId, parent) : Promise.resolve({})))
			.then(() => {
				if (this.fileRegexCheck(filename)) {
					throw new BadRequest(`Die Datei '${filename}' ist nicht erlaubt!`);
				}

				return this.getStrategy().generateSignedUrl({
					userId,
					flatFileName,
					fileType,
					header,
				});
			})
			.then((res) => ({
				url: res,
				header: {
					'Content-Type': fileType,
					'x-amz-meta-name': header.name,
					'x-amz-meta-flat-name': header['flat-name'],
				},
			}))
			.catch((err) => {
				if (!err) {
					throw new Forbidden();
				}
				throw err;
			});
	},

	async find({ query, payload: { userId, fileStorageType } }) {
		const { file, download } = query;
		const fileObject = await FileModel.findOne({ _id: file }).lean().exec();

		if (!fileObject) {
			throw new NotFound('File seems not to be there.');
		}

		const { storageProviderId, bucket } = await getStorageProviderIdAndBucket(userId, fileObject);

		if (download && fileObject.securityCheck && fileObject.securityCheck.status === SecurityCheckStatusTypes.BLOCKED) {
			throw new Forbidden('File access blocked by security check.');
		}

		return canRead(userId, file)
			.then(() =>
				this.getStrategy().getSignedUrl({
					storageProviderId,
					bucket,
					flatFileName: fileObject.storageFileName,
					localFileName: query.name || fileObject.name,
					download: true,
				})
			)
			.then((res) => ({
				url: res,
			}))
			.catch((err) => new Forbidden(err));
	},

	async patch(id, data, params) {
		const { payload } = params;
		const { userId } = payload;
		const fileObject = await FileModel.findOne({ _id: id }).lean().exec();

		if (!fileObject) {
			throw new NotFound('File seems not to be there.');
		}

		const { storageProviderId, bucket } = await getStorageProviderIdAndBucket(userId, fileObject);

		return canRead(userId, id)
			.then(() =>
				this.getStrategy().getSignedUrl({
					storageProviderId,
					bucket,
					flatFileName: fileObject.storageFileName,
					action: 'putObject',
				})
			)
			.then((signedUrl) => ({
				url: signedUrl,
			}))
			.catch((err) => new Forbidden(err));
	},
};

const directoryService = {
	docs: swaggerDocs.directoryService,

	setup(app) {
		this.app = app;
	},

	setRefId(perm) {
		if (!perm.refId) {
			perm.refId = perm._id;
		}
		return perm;
	},

	directoryExists({ name, owner, parent, userId }) {
		return FileModel.findOne({
			owner: owner || userId,
			parent,
			isDirectory: true,
			name,
		})
			.lean()
			.exec();
	},

	folderRegexCheck(fileName) {
		return [
			/^[a-zA-Z]{1}_drive$/,
			/^Windows$/,
			/^\$.*$/,
			/^\..*$/,
			/^Temporary Items$/,
			/^Network Trash Folder$/,
			/^ *$/,
		].some((rx) => rx.test(fileName));
	},

	getStudentRoleId() {
		return RoleModel.findOne({ name: 'student' })
			.select('_id')
			.lean()
			.exec()
			.then((role) => role._id);
	},

	/**
	 * @param data, directory data containing name, parent, owner
	 * @param params,
	 * @returns {Promise}
	 */
	async create(data, params) {
		const {
			payload: { userId },
		} = params;
		const { owner, parent, name } = data;
		const permissions = [createPermission(userId)];

		if (this.folderRegexCheck(name)) {
			throw new BadRequest(`Der Ordner '${name}' ist nicht erlaubt!`);
		}
		// todo: move permissions for directorys to createDefaultPermissions.js
		let { permissions: sendPermissions } = data;
		const refOwnerModel = await getRefOwnerModel(owner);

		if (refOwnerModel === 'course') {
			const studentRoleId = await this.getStudentRoleId();
			// students can always read course files
			permissions.push(createPermission(studentRoleId, 'role', { write: false, delete: false }));
		}

		if (!sendPermissions) {
			const teamObject = await teamsModel.findOne({ _id: owner }).lean().exec();
			sendPermissions = teamObject ? teamObject.filePermission : [];
		}

		const props = sanitizeObj(
			Object.assign(data, {
				isDirectory: true,
				owner: owner || userId,
				parent,
				refOwnerModel,
				creator: userId,
				permissions: [...permissions, ...sendPermissions].map(this.setRefId),
			})
		);

		// create db entry for new directory
		// check for create permissions if it is a subdirectory

		if (parent) {
			return canCreate(userId, parent)
				.then(() =>
					this.directoryExists({
						name,
						owner,
						parent,
						userId,
					}).then((_data) => (_data ? Promise.resolve(_data) : FileModel.create(props)))
				)
				.catch((err) => new Forbidden(err));
		}

		return this.directoryExists({
			name,
			owner,
			parent,
			userId,
		}).then((_data) => (_data ? Promise.resolve(_data) : FileModel.create(props)));
	},

	/**
	 * @returns {Promise}
	 * @param query contains the ID of parent folder (optional)
	 * @param payload contains userId set by middleware
	 */
	async find({ query, payload }) {
		const { parent } = query;
		const { userId } = payload;

		const scopeNames = ['courses', 'teams'];
		const getScopeListService = (scopeName) => this.app.service(`/users/:scopeId/${scopeName}`);

		const scopeFilters = await Promise.all(
			scopeNames.map(async (scopeName) => {
				const scopeListService = getScopeListService(scopeName);
				const scopeList = await scopeListService.find({
					route: { scopeId: userId },
					query: {},
					paginate: false,
				});
				return {
					refOwnerModel: scopeName,
					owner: {
						$in: scopeList,
					},
				};
			})
		);

		const params = sanitizeObj({
			$or: [
				{
					refOwnerModel: 'user',
					owner: userId,
				},
				...scopeFilters,
			],
			isDirectory: true,
			parent,
		});

		return FileModel.find(params)
			.exec()
			.then((files) =>
				Promise.all(
					files.map((f) =>
						canRead(userId, f)
							.then(() => f)
							.catch(() => undefined)
					)
				)
			)
			.then((allowedFiles) => {
				const files = allowedFiles.filter((f) => f);
				return files.length ? files : new NotFound();
			});
	},

	/**
	 * @param id, params
	 * @returns {Promise}
	 */
	async remove(id, { query, payload }) {
		const { userId } = payload;
		const { _id } = query;

		// check permissions
		try {
			await canDelete(userId, _id);
		} catch (err) {
			throw new Forbidden();
		}

		await filesRepo.removeFileById(_id);
	},
};

const renameService = {
	docs: swaggerDocs.renameService,

	/**
	 * @param data, contains id of fileObject and newName
	 * @returns {Promise}
	 */
	create(data, params) {
		const {
			payload: { userId },
		} = params;
		const { newName, id } = data;

		if (!id || !newName) {
			return Promise.reject(new BadRequest('Missing parameters'));
		}

		const _id = id;

		return canWrite(userId, _id)
			.then(() => FileModel.findOne({ _id }).exec())
			.then((obj) => {
				if (!obj) {
					return new NotFound('The given directory/file was not found!');
				}
				return FileModel.update({ _id }, { name: newName }).exec();
			})
			.catch((err) => new Forbidden(err));
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
		return Promise.resolve({
			total: 0,
			totalSize: 0,
		});
	},
};

const bucketService = {
	docs: swaggerDocs.bucketService,
	Stategy: AWSS3Strategy,

	getStrategy() {
		return new this.Stategy();
	},

	/**
	 * @param data, contains schoolId
	 * FIX-ME:
	 * - Check if user in payload is administrator
	 * @returns {Promise}
	 */
	create(data) {
		const { schoolId } = data;

		return this.getStrategy().create(schoolId);
	},
};

const copyService = {
	docs: swaggerDocs.copyService,

	defaultPermissionHandler(userId, file, parent) {
		return Promise.all([canRead(userId, file), canWrite(userId, parent)]);
	},
	/**
	 * @param data, contains file-Id and new parent
	 * @returns {Promise}
	 */
	create(data, params) {
		return copyFile(data, params, this.defaultPermissionHandler);
	},
};

const newFileService = {
	docs: swaggerDocs.newFileService,

	/**
	 * @param data, contains filename, owner, parent and studentCanEdit
	 * @returns {Promise}
	 */
	create(data, params) {
		const { name, owner, parent, studentCanEdit } = data;
		const fType = name.split('.').pop();
		const buffer = fs.readFileSync(`src/services/fileStorage/resources/fake.${fType}`);
		const flatFileName = generateFileNameSuffix(name);

		return signedUrlService
			.create(
				{
					fileType: returnFileType(name),
					parent,
					// filename: name,
					flatFileName,
				},
				params
			)
			.then((signedUrl) => {
				const headers = signedUrl.header;
				if (Configuration.get('REQUEST_OPTION__KEEP_ALIVE')) {
					headers.Connection = 'Keep-Alive';
				}
				return axios({
					method: 'PUT',
					url: signedUrl.url,
					data: buffer,
					headers,
				});
			})
			.then(() =>
				fileStorageService.create(
					{
						size: buffer.length,
						storageFileName: flatFileName,
						type: returnFileType(name),
						thumbnail: '',
						name,
						owner,
						parent,
						studentCanEdit,
					},
					params
				)
			);
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
		const {
			payload: { userId },
		} = params;
		const { permissions: commitedPerms } = data;

		const permissionPromises = commitedPerms.map(({ refId }) =>
			Promise.all([
				RoleModel.findOne({ _id: refId }).lean().exec(),
				userModel.findOne({ _id: refId }).lean().exec(),
			]).then(([role, user]) => {
				if (role) {
					return 'role';
				}
				return user ? 'user' : '';
			})
		);

		return canWrite(userId, _id)
			.then(() => Promise.all([FileModel.findOne({ _id }).exec(), permissionPromises]))
			.then(([fileObject, refModels]) => {
				if (!fileObject) {
					return new NotFound(`File with ID ${_id} not found`);
				}

				let { permissions } = fileObject;

				permissions = permissions.map((perm) => {
					const update = commitedPerms.find(({ refId }) => perm.refId.equals(refId));

					if (update) {
						const { write, read, create } = update;

						return Object.assign(
							perm,
							sanitizeObj({
								write,
								read,
								create,
								delete: update.delete,
							})
						);
					}

					return perm;
				});

				permissions = [
					...permissions,
					...commitedPerms
						.filter(({ refId }) => permissions.findIndex(({ refId: id }) => id.equals(refId)) === -1)
						.map((perm, idx) => {
							const { write, read, create, refId } = perm;

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

				return FileModel.update(
					{ _id },
					{
						$set: { permissions },
					}
				).exec();
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
		const rolePromises = rolePermissions.map(({ refId }) => RoleModel.findOne({ _id: refId }).lean().exec());
		// deprecated: author check via file.permissions[0]?.refId is deprecated and will be removed in the next release
		const isFileCreator = equalIds(fileObj.creator || fileObj.permissions[0]?.refId, userId);

		const actionMap = {
			user: () => {
				const userPermission = fileObj.permissions
					.filter(({ refPermModel }) => refPermModel === 'user')
					.filter(({ refId }) => !refId.equals(userId));

				return Promise.all(userPermission.map(({ refId }) => userModel.findOne({ _id: refId }).exec())).then(
					(result) => {
						const users = result ? result.filter((u) => u) : [];
						if (users.length) {
							return userPermission.map((perm) => {
								const { firstName, lastName, _id } = users.find(({ _id: id }) => id.equals(perm.refId));

								return {
									refId: _id,
									name: `${firstName} ${lastName}`,
									...perm,
								};
							});
						}

						return Promise.resolve([]);
					}
				);
			},
			course() {
				const isStudent = userObject.roles.some(({ name }) => name === 'student');

				return Promise.all(rolePromises).then((roles) =>
					rolePermissions
						.map((perm) => {
							const { name } = roles.find(({ _id }) => _id.equals(perm.refId));
							const { read, write, refId } = perm;

							const nameMap = {
								student() {
									return isStudent
										? {
												read,
												write: isFileCreator ? write : undefined,
										  }
										: { write, read };
								},
								teacher() {
									return isStudent
										? {}
										: {
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
						})
				);
			},
			teams() {
				const { role: userRole } = owner.userIds.find((u) => userId.equals(u.userId));

				return Promise.all(rolePromises)
					.then(sortRoles)
					.then((sortedRoles) => {
						const userPos = sortedRoles.findIndex((roles) => roles.findIndex(({ _id }) => _id.equals(userRole)) > -1);

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
								const { read, write, refId } = rolePermissions.find(({ refId: id }) => id.equals(_id));
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

const shareTokenService = {
	async get(id, params) {
		if (!params.query || !params.query.shareToken) {
			// no share token provided
			throw new Forbidden('invalid share token.');
		}

		const shareToken = params.query ? params.query.shareToken : undefined;
		const file = await FileModel.findOne({ _id: id, shareTokens: shareToken }).lean().exec();
		if (!file) {
			throw new Forbidden('invalid share token.');
		}

		return file;
	},

	async patch(id, data, params) {
		await canRead(params.payload.userId, id).catch(() => {
			throw new Forbidden();
		});
		const token = data.shareToken;
		if (!token) throw new BadRequest('shareToken is required');
		const file = await FileModel.findOneAndUpdate({ _id: id }, { $push: { shareTokens: token } })
			.lean()
			.exec();
		return file;
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
	app.use('/fileStorage/shared', shareTokenService);
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
		'/fileStorage/shared',
		'/fileStorage/permission',
	].forEach((apiPath) => {
		// Get our initialize service to that we can bind hooks
		const service = app.service(apiPath);
		service.hooks(hooks);
	});
};
