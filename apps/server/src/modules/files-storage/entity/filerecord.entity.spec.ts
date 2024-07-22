import { PreviewInputMimeTypes } from '@infra/preview-generator';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ErrorType } from '../error';
import { FileRecordParentType, StorageLocation } from '../interface';
import {
	FileRecord,
	FileRecordProperties,
	FileRecordSecurityCheck,
	PreviewStatus,
	ScanStatus,
} from './filerecord.entity';

describe('FileRecord Entity', () => {
	beforeAll(async () => {
		await setupEntities([FileRecord]);
	});

	describe('when creating a new instance using the constructor', () => {
		let props: FileRecordProperties;

		beforeEach(() => {
			props = {
				size: Math.round(Math.random() * 100000),
				name: `file-record #1`,
				mimeType: 'application/octet-stream',
				parentType: FileRecordParentType.Course,
				parentId: new ObjectId().toHexString(),
				creatorId: new ObjectId().toHexString(),
				storageLocationId: new ObjectId().toHexString(),
				storageLocation: StorageLocation.SCHOOL,
			};
		});

		it('should provide target id', () => {
			const parentId = new ObjectId().toHexString();
			const fileRecord = new FileRecord({
				...props,
				parentId,
			});
			expect(fileRecord.parentId).toEqual(parentId);
		});

		it('should provide creator id', () => {
			const creatorId = new ObjectId().toHexString();
			const fileRecord = new FileRecord({
				...props,
				creatorId,
			});
			expect(fileRecord.creatorId).toEqual(creatorId);
		});

		it('should provide storageLocationId', () => {
			const storageLocationId = new ObjectId().toHexString();
			const fileRecord = new FileRecord({
				...props,
				storageLocationId,
			});
			expect(fileRecord.storageLocationId).toEqual(storageLocationId);
		});

		it('should provide isCopyFrom', () => {
			const isCopyFrom = new ObjectId().toHexString();
			const fileRecord = new FileRecord({
				...props,
				isCopyFrom,
			});
			expect(fileRecord.isCopyFrom).toEqual(isCopyFrom);
		});

		it('should provide isUploading', () => {
			const isUploading = true;
			const fileRecord = new FileRecord({
				...props,
				isUploading,
			});
			expect(fileRecord.isUploading).toEqual(isUploading);
		});
	});

	describe('when embedding the security status', () => {
		it('should set the embedded status property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, '');
			expect(fileRecord.securityCheck?.status).toEqual(ScanStatus.VERIFIED);
		});

		it('should set the embedded reason property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.reason).toEqual('scanned');
		});

		it('should set the embedded requestToken property', () => {
			const fileRecord = fileRecordFactory.build();
			//	fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.requestToken).toBeDefined();
		});

		it('should set to `undifined` the embedded requestToken property', () => {
			const fileRecord = fileRecordFactory.build();
			fileRecord.updateSecurityCheckStatus(ScanStatus.VERIFIED, 'scanned');
			expect(fileRecord.securityCheck?.requestToken).toBeUndefined();
		});
	});

	describe('FileRecordSecurityCheck', () => {
		it('should set the requestToken via the constructor', () => {
			const securityCheck = new FileRecordSecurityCheck({ requestToken: '08154711' });
			expect(securityCheck.requestToken).toEqual('08154711');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the status via the constructor', () => {
			const securityCheck = new FileRecordSecurityCheck({ status: ScanStatus.PENDING });
			expect(securityCheck.status).toEqual(ScanStatus.PENDING);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the reason via the constructor', () => {
			const securityCheck = new FileRecordSecurityCheck({ reason: 'test-reason' });
			expect(securityCheck.reason).toEqual('test-reason');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
		});
	});

	describe('setName is called', () => {
		describe('WHEN new name has length > 0', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();
				const newName = 'newName';

				return { fileRecord, newName };
			};

			it('should set name', () => {
				const { fileRecord, newName } = setup();

				fileRecord.setName(newName);

				expect(fileRecord.name).toBe(newName);
			});
		});

		describe('WHEN new name is empty string', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();
				const newName = '';

				return { fileRecord, newName };
			};

			it('should throw error and not set name', () => {
				const { fileRecord, newName } = setup();
				const error = new BadRequestException(ErrorType.FILE_NAME_EMPTY);

				expect(() => {
					fileRecord.setName(newName);
				}).toThrow(error);
				expect(fileRecord.name).not.toBe(newName);
			});
		});
	});

	describe('hasName is called', () => {
		describe('WHEN name is equal', () => {
			const setup = () => {
				const name = 'name123';
				const fileRecord = fileRecordFactory.build({ name });

				return { fileRecord, name };
			};

			it('should be true', () => {
				const { fileRecord, name } = setup();

				const result = fileRecord.hasName(name);

				expect(result).toBe(true);
			});
		});

		describe('WHEN name is not equal', () => {
			const setup = () => {
				const name = 'name123';
				const fileRecord = fileRecordFactory.build({ name: 'name' });

				return { fileRecord, name };
			};

			it('should be false', () => {
				const { fileRecord, name } = setup();

				const result = fileRecord.hasName(name);

				expect(result).toBe(false);
			});
		});
	});

	describe('getName is called', () => {
		describe('WHEN name exists', () => {
			const setup = () => {
				const name = 'name123';
				const fileRecord = fileRecordFactory.build({ name });

				return { fileRecord, name };
			};

			it('should return the correct name', () => {
				const { fileRecord, name } = setup();

				const result = fileRecord.getName();

				expect(result).toEqual(name);
			});
		});
	});

	describe('getSecurityToken is called', () => {
		describe('WHEN security token exists', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				return { fileRecord };
			};

			it('should return the correct token', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getSecurityToken();

				expect(result).toEqual(fileRecord.securityCheck.requestToken);
			});
		});
	});

	describe('getParentInfo is called', () => {
		describe('WHEN parentId and parentType and mimeType exists', () => {
			const setup = () => {
				const parentType = FileRecordParentType.School;
				const parentId = new ObjectId().toHexString();
				const storageLocationId = new ObjectId().toHexString();
				const storageLocation = StorageLocation.INSTANCE;
				const fileRecord = fileRecordFactory.build({ parentType, parentId, storageLocationId, storageLocation });

				return { fileRecord, parentId, parentType, storageLocationId, storageLocation };
			};

			it('should return an object that include parentId and parentType', () => {
				const { fileRecord, parentId, parentType, storageLocationId, storageLocation } = setup();

				const result = fileRecord.getParentInfo();

				expect(result).toEqual({ parentId, parentType, storageLocationId, storageLocation });
			});
		});
	});

	describe('isBlocked is called', () => {
		describe('WHEN file record security status is BLOCKED', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord };
			};

			it('should return true', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isBlocked();

				expect(result).toBe(true);
			});
		});

		describe('WHEN file record security status is not BLOCKED', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.VERIFIED;

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isBlocked();

				expect(result).toBe(false);
			});
		});
	});

	describe('hasScanStatusError is called', () => {
		describe('WHEN file record security status is ERROR', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.ERROR;

				return { fileRecord };
			};

			it('should return true', () => {
				const { fileRecord } = setup();

				const result = fileRecord.hasScanStatusError();

				expect(result).toBe(true);
			});
		});

		describe('WHEN file record security status is not ERROR', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.VERIFIED;

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isBlocked();

				expect(result).toBe(false);
			});
		});
	});

	describe('hasScanStatusWontCheck is called', () => {
		describe('WHEN file record security status is WONT_CHECK', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.WONT_CHECK;

				return { fileRecord };
			};

			it('should return true', () => {
				const { fileRecord } = setup();

				const result = fileRecord.hasScanStatusWontCheck();

				expect(result).toBe(true);
			});
		});

		describe('WHEN file record security status is not WONT_CHECK', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.VERIFIED;

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.hasScanStatusWontCheck();

				expect(result).toBe(false);
			});
		});
	});

	describe('isPending is called', () => {
		describe('WHEN file record security status is PENDING', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.PENDING;

				return { fileRecord };
			};

			it('should return true', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isPending();

				expect(result).toBe(true);
			});
		});

		describe('WHEN file record security status is not PENDING', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.VERIFIED;

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isPending();

				expect(result).toBe(false);
			});
		});
	});

	describe('isVerified is called', () => {
		describe('WHEN file record security status is VERIFIED', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.VERIFIED;

				return { fileRecord };
			};

			it('should return true', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isVerified();

				expect(result).toBe(true);
			});
		});

		describe('WHEN file record security status is not VERIFIED', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build();

				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isVerified();

				expect(result).toBe(false);
			});
		});
	});

	describe('copy is called', () => {
		const getCopyData = () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const userId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();
			const storageLocationId = new ObjectId().toHexString();
			const storageLocation = StorageLocation.INSTANCE;
			const parentType = FileRecordParentType.School;
			const targetParentInfo = { parentId, parentType, storageLocationId, storageLocation };

			return {
				fileRecord,
				targetParentInfo,
				userId,
			};
		};

		describe('when valid input is passed', () => {
			const setup = () => {
				const { fileRecord, targetParentInfo, userId } = getCopyData();

				return {
					fileRecord,
					targetParentInfo,
					userId,
				};
			};

			it('should return a instance of fileRecord', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result).toBeInstanceOf(FileRecord);
			});

			it('should create a new instance', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result).not.toBe(fileRecord);
			});

			it('should copy the file meta data from source file', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result.mimeType).toEqual(fileRecord.mimeType);
				expect(result.name).toEqual(fileRecord.name);
				expect(result.size).toEqual(fileRecord.size);
				expect(result.isCopyFrom).toEqual(fileRecord.id);
			});

			it('should override the creator and targetParentInfo data in target file from passed params', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result.creatorId).toEqual(userId);
				expect(result.parentType).toEqual(targetParentInfo.parentType);
				expect(result.parentId).toEqual(targetParentInfo.parentId);
				expect(result.storageLocationId).toEqual(targetParentInfo.storageLocationId);
				expect(result.storageLocation).toEqual(targetParentInfo.storageLocation);
			});
		});

		describe('given a scan status exists', () => {
			describe('WHEN source files scan status is VERIFIED', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData();
					fileRecord.securityCheck.status = ScanStatus.VERIFIED;

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should copy the securityCheck from source file', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).toStrictEqual(fileRecord.securityCheck);
				});
			});

			describe('WHEN source files scan status is BLOCKED', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData();
					fileRecord.securityCheck.status = ScanStatus.BLOCKED;

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.securityCheck);
				});
			});

			describe('WHEN source files scan status is PENDING', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData();
					fileRecord.securityCheck.status = ScanStatus.PENDING;

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.securityCheck);
				});
			});

			describe('WHEN source files scan status is ERROR', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData();
					fileRecord.securityCheck.status = ScanStatus.ERROR;

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.securityCheck);
				});
			});
		});
	});

	describe('getPreviewStatus is called', () => {
		describe('WHEN file record securityCheck status is PENDING', () => {
			const setup = () => {
				const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.PENDING;

				return { fileRecord };
			};

			it('should return AWAITING_SCAN_STATUS', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.AWAITING_SCAN_STATUS);
			});
		});

		describe('WHEN file record securityCheck status is PENDING and mime type is not previewable', () => {
			const setup = () => {
				const mimeType = 'application/octet-stream';
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.PENDING;

				return { fileRecord };
			};

			it('should return AWAITING_SCAN_STATUS', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE);
			});
		});

		describe('WHEN file record securityCheck status is VERIFIED', () => {
			describe('MIMETYPE is supported', () => {
				const setup = () => {
					const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
					const fileRecord = fileRecordFactory.build({ mimeType });

					fileRecord.securityCheck.status = ScanStatus.VERIFIED;

					return { fileRecord };
				};

				it('should return PREVIEW_POSSIBLE', () => {
					const { fileRecord } = setup();

					const result = fileRecord.getPreviewStatus();

					expect(result).toEqual(PreviewStatus.PREVIEW_POSSIBLE);
				});
			});

			describe('MIMETYPE is not supported', () => {
				const setup = () => {
					const fileRecord = fileRecordFactory.build();

					fileRecord.securityCheck.status = ScanStatus.VERIFIED;

					return { fileRecord };
				};

				it('should return PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE', () => {
					const { fileRecord } = setup();

					const result = fileRecord.getPreviewStatus();

					expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE);
				});
			});
		});

		describe('WHEN file record securityCheck status is ERROR', () => {
			const setup = () => {
				const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.ERROR;

				return { fileRecord };
			};

			it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR);
			});
		});

		describe('WHEN file record securityCheck status is BLOCKED', () => {
			const setup = () => {
				const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord };
			};

			it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED);
			});
		});

		describe('WHEN file record securityCheck status is BLOCKED and mime type is not previewable', () => {
			const setup = () => {
				const mimeType = 'application/octet-stream';
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.BLOCKED;

				return { fileRecord };
			};

			it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED);
			});
		});

		describe('WHEN file record securityCheck status is WONT_CHECK', () => {
			const setup = () => {
				const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = ScanStatus.WONT_CHECK;

				return { fileRecord };
			};

			it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK);
			});
		});

		describe('WHEN file record securityCheck status is of other than ScanStatus Enum value', () => {
			const setup = () => {
				const mimeType = PreviewInputMimeTypes.IMAGE_JPEG;
				const fileRecord = fileRecordFactory.build({ mimeType });

				fileRecord.securityCheck.status = 'OTHER_STATUS' as ScanStatus;

				return { fileRecord };
			};

			it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR', () => {
				const { fileRecord } = setup();

				const result = fileRecord.getPreviewStatus();

				expect(result).toEqual(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR);
			});
		});
	});

	describe('fileNameWithoutExtension is called', () => {
		describe('WHEN file name has extension', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build({ name: 'file-name.jpg' });

				return { fileRecord };
			};

			it('should return the correct file name without extension', () => {
				const { fileRecord } = setup();

				const result = fileRecord.fileNameWithoutExtension;

				expect(result).toEqual('file-name');
			});
		});

		describe('WHEN file name has not extension', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build({ name: 'file-name' });

				return { fileRecord };
			};

			it('should return the correct file name without extension', () => {
				const { fileRecord } = setup();

				const result = fileRecord.fileNameWithoutExtension;

				expect(result).toEqual('file-name');
			});
		});

		describe('WHEN file name starts with dot', () => {
			const setup = () => {
				const fileRecord = fileRecordFactory.build({ name: '.bild.123.jpg' });

				return { fileRecord };
			};

			it('should return the correct file name without extension', () => {
				const { fileRecord } = setup();

				const result = fileRecord.fileNameWithoutExtension;

				expect(result).toEqual('.bild.123');
			});
		});
	});

	describe('removeCreatorId is called', () => {
		describe('WHEN creatorId exists', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();
				const fileRecord = fileRecordFactory.build({ creatorId });

				return { fileRecord, creatorId };
			};

			it('should set it to undefined', () => {
				const { fileRecord } = setup();

				const result = fileRecord.removeCreatorId();

				expect(result).toBe(undefined);
			});
		});
	});

	describe('markAsLoaded is called', () => {
		describe('WHEN isUploading is true', () => {
			const setup = () => {
				const isUploading = true;
				const fileRecord = fileRecordFactory.build({ isUploading });

				return { fileRecord, isUploading };
			};

			it('should set it to undefined', () => {
				const { fileRecord } = setup();
				expect(fileRecord.isUploading).toBe(true);
				const result = fileRecord.markAsUploaded();

				expect(result).toBe(undefined);
			});
		});
	});
});
