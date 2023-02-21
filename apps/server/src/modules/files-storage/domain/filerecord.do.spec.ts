import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../error';
import { FileRecordParentType, ScanStatus, FileRecord } from './filerecord.do';
import { FileRecordTestFactory } from './filerecord-test.factory';
import { FileSecurityCheck } from '../repo/filerecord.entity';
import { FileRecordParams } from '../controller/dto';

// TODO: Add factory and fix tests
describe('FileRecord', () => {
	describe('when embedding the security status', () => {
		const setup = () => {
			const fileRecord = FileRecordTestFactory.build();

			return { fileRecord };
		};

		it('should set the embedded status property', () => {
			const { fileRecord } = setup();

			fileRecord.updateSecurityCheckStatus({ status: ScanStatus.VERIFIED, reason: '' });

			expect(fileRecord.getProps().securityCheck?.status).toEqual(ScanStatus.VERIFIED);
		});

		it('should set the embedded reason property', () => {
			const { fileRecord } = setup();

			fileRecord.updateSecurityCheckStatus({ status: ScanStatus.VERIFIED, reason: 'scanned' });
			expect(fileRecord.getProps().securityCheck?.reason).toEqual('scanned');
		});

		it('should set the embedded requestToken property', () => {
			const { fileRecord } = setup();

			// fileRecord.updateSecurityCheckStatus({ status: ScanStatus.VERIFIED, reason: 'scanned' });

			expect(fileRecord.getProps().securityCheck?.requestToken).toBeDefined();
		});

		it('should set to `undifined` the embedded requestToken property', () => {
			const { fileRecord } = setup();

			fileRecord.updateSecurityCheckStatus({ status: ScanStatus.VERIFIED, reason: 'scanned' });

			expect(fileRecord.getProps().securityCheck?.requestToken).toBeUndefined();
		});
	});
	// TODO: Fix construct for security
	// FileRecordTestFactory.buildSecurityCheckProps()
	/*
	describe('FileSecurityCheck', () => {
		it('should set the requestToken via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ requestToken: '08154711' });
			expect(securityCheck.requestToken).toEqual('08154711');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the status via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ status: ScanStatus.PENDING });
			expect(securityCheck.status).toEqual(ScanStatus.PENDING);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
			expect(securityCheck.reason).toEqual(securityCheck.reason);
		});
		it('should set the reason via the constructor', () => {
			const securityCheck = new FileSecurityCheck({ reason: 'test-reason' });
			expect(securityCheck.reason).toEqual('test-reason');
			expect(securityCheck.status).toEqual(securityCheck.status);
			expect(securityCheck.requestToken).toEqual(securityCheck.requestToken);
		});
	});
*/
	describe('setName is called', () => {
		describe('WHEN new name has length > 0', () => {
			const setup = () => {
				const fileRecord = FileRecordTestFactory.build();
				const newName = 'newName';

				return { fileRecord, newName };
			};

			it('should set name', () => {
				const { fileRecord, newName } = setup();

				fileRecord.setName(newName);

				expect(fileRecord.getProps().name).toBe(newName);
			});
		});

		describe('WHEN new name is empty string', () => {
			const setup = () => {
				const fileRecord = FileRecordTestFactory.build();
				const newName = '';

				return { fileRecord, newName };
			};

			it('should throw error and not set name', () => {
				const { fileRecord, newName } = setup();
				const error = new BadRequestException(ErrorType.FILE_NAME_EMPTY);

				expect(() => {
					fileRecord.setName(newName);
				}).toThrow(error);
				expect(fileRecord.getProps().name).not.toBe(newName);
			});
		});
	});

	describe('hasName is called', () => {
		describe('WHEN name is equal', () => {
			const setup = () => {
				const name = 'name123';
				const fileRecord = FileRecordTestFactory.build({ name });

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
				const fileRecord = FileRecordTestFactory.build({ name: 'name' });

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
				const fileRecord = FileRecordTestFactory.build({ name });

				return { fileRecord, name };
			};

			it('should return the correct name', () => {
				const { fileRecord, name } = setup();

				const result = fileRecord.getName();

				expect(result).toEqual(name);
			});
		});
	});

	describe('getSchoolId is called', () => {
		describe('WHEN schoolId exists', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const fileRecord = FileRecordTestFactory.build({ schoolId });

				return { fileRecord, schoolId };
			};

			it('should return the correct schoolId', () => {
				const { fileRecord, schoolId } = setup();

				const result = fileRecord.getSchoolId();

				expect(result).toEqual(schoolId);
			});
		});
	});

	describe('getParentInfo is called', () => {
		describe('WHEN parentId and parentType and mimeType exists', () => {
			const setup = () => {
				const parentType = FileRecordParentType.School;
				const parentId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const fileRecord = FileRecordTestFactory.build({ parentType, parentId, schoolId });

				return { fileRecord, parentId, parentType, schoolId };
			};

			it('should return an object that include parentId and parentType', () => {
				const { fileRecord, parentId, parentType, schoolId } = setup();

				const result = fileRecord.getParentInfo();

				expect(result).toEqual({ parentId, parentType, schoolId });
			});
		});
	});

	describe('isBlocked is called', () => {
		describe('WHEN file record security status is BLOCKED', () => {
			const setup = () => {
				// TODO: builder
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.BLOCKED });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

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
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.VERIFIED });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

				return { fileRecord };
			};

			it('should return false', () => {
				const { fileRecord } = setup();

				const result = fileRecord.isBlocked();

				expect(result).toBe(false);
			});
		});
	});

	describe('isPending is called', () => {
		describe('WHEN file record security status is PENDING', () => {
			const setup = () => {
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.PENDING });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

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
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.VERIFIED });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

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
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.VERIFIED });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

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
				const securityCheck = new FileSecurityCheck({ status: ScanStatus.BLOCKED });
				const fileRecord = FileRecordTestFactory.build({ securityCheck });

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
		const getCopyData = (status?: ScanStatus) => {
			const securityCheck = new FileSecurityCheck({ status });
			const fileRecord = FileRecordTestFactory.build({ securityCheck });
			const userId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const parentType = FileRecordParentType.School;
			const targetParentInfo = { parentId, schoolId, parentType };

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

			// TODO: wrong place for this test, factory, or builder should be create the properties and can be tested it self
			it('should return a instance of fileRecord', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(typeof result).toBe('object');
			});

			it('should create a new instance', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result).not.toBe(fileRecord);
			});

			it('should copy the file meta data from source file', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				const { mimeType, name, size } = fileRecord.getProps();
				expect(result.mimeType).toEqual(mimeType);
				expect(result.name).toEqual(name);
				expect(result.size).toEqual(size);
			});

			it('should override the creator and targetParentInfo data in target file from passed params', () => {
				const { fileRecord, targetParentInfo, userId } = setup();

				const result = fileRecord.copy(userId, targetParentInfo);

				expect(result.creatorId).toEqual(userId);
				expect(result.parentType).toEqual(targetParentInfo.parentType);
				expect(result.parentId).toEqual(targetParentInfo.parentId);
				expect(result.schoolId).toEqual(targetParentInfo.schoolId);
			});
		});

		describe('given a scan status exists', () => {
			describe('WHEN source files scan status is VERIFIED', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData(ScanStatus.VERIFIED);

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should copy the securityCheck from source file', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).toStrictEqual(fileRecord.getProps().securityCheck);
				});
			});

			describe('WHEN source files scan status is BLOCKED', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData(ScanStatus.BLOCKED);

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.getProps().securityCheck);
				});
			});

			describe('WHEN source files scan status is PENDING', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData(ScanStatus.PENDING);

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.getProps().securityCheck);
				});
			});

			describe('WHEN source files scan status is ERROR', () => {
				const setup = () => {
					const { fileRecord, targetParentInfo, userId } = getCopyData(ScanStatus.ERROR);

					return {
						fileRecord,
						targetParentInfo,
						userId,
					};
				};

				it('should create a new securitycheck for copy', () => {
					const { fileRecord, targetParentInfo, userId } = setup();

					const result = fileRecord.copy(userId, targetParentInfo);

					expect(result.securityCheck).not.toStrictEqual(fileRecord.getProps().securityCheck);
				});
			});
		});
	});
});
