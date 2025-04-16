import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordProps, FileRecordSecurityCheck, ScanStatus } from '../domain';
import { FileRecordParentType, StorageLocation } from '../domain/interface';
import { fileRecordEntityFactory } from '../testing';
import { FileRecordSecurityCheckEmbeddable } from './file-record.entity';

describe('FileRecord Entity', () => {
	describe('when creating a new instance using the factory', () => {
		let props: FileRecordProps;

		beforeEach(() => {
			props = {
				id: new ObjectId().toHexString(),
				size: Math.round(Math.random() * 100000),
				name: `file-record #1`,
				mimeType: 'application/octet-stream',
				parentType: FileRecordParentType.Course,
				parentId: new ObjectId().toHexString(),
				creatorId: new ObjectId().toHexString(),
				storageLocationId: new ObjectId().toHexString(),
				storageLocation: StorageLocation.SCHOOL,
				createdAt: new Date(),
				updatedAt: new Date(),
				securityCheck: FileRecordSecurityCheck.createWithDefaultProps(),
			};
		});

		it('should provide parent id', () => {
			const parentId = new ObjectId().toHexString();
			const fileRecord = fileRecordEntityFactory.build({
				...props,
				parentId,
			});
			expect(fileRecord.parentId).toEqual(parentId);
		});

		it('should provide creator id', () => {
			const creatorId = new ObjectId().toHexString();
			const fileRecord = fileRecordEntityFactory.build({
				...props,
				creatorId,
			});
			expect(fileRecord.creatorId).toEqual(creatorId);
		});

		it('should provide storageLocationId', () => {
			const storageLocationId = new ObjectId().toHexString();
			const fileRecord = fileRecordEntityFactory.build({
				...props,
				storageLocationId,
			});
			expect(fileRecord.storageLocationId).toEqual(storageLocationId);
		});

		it('should provide isCopyFrom', () => {
			const isCopyFrom = new ObjectId().toHexString();
			const fileRecord = fileRecordEntityFactory.build({
				...props,
				isCopyFrom,
			});
			expect(fileRecord.isCopyFrom).toEqual(isCopyFrom);
		});

		it('should provide isUploading', () => {
			const isUploading = true;
			const fileRecord = fileRecordEntityFactory.build({
				...props,
				isUploading,
			});
			expect(fileRecord.isUploading).toEqual(isUploading);
		});
	});
});

describe('FileRecordSecurityCheckEmbeddable', () => {
    it('should initialize with default values when no props are provided', () => {
      const securityCheck = new FileRecordSecurityCheckEmbeddable({});
      expect(securityCheck.status).toBe(ScanStatus.PENDING);
      expect(securityCheck.reason).toBe('not yet scanned');
      expect(securityCheck.requestToken).toBeDefined();
      expect(securityCheck.createdAt).toBeInstanceOf(Date);
      expect(securityCheck.updatedAt).toBeInstanceOf(Date);
    });
  
    it('should override the provided properties', () => {
        const updatedAt = new Date();
      const securityCheck = new FileRecordSecurityCheckEmbeddable({
        status: ScanStatus.ERROR,
        reason: 'scan failed',
        requestToken: 'custom-token',
        updatedAt,
      });
      expect(securityCheck.status).toBe(ScanStatus.ERROR);
      expect(securityCheck.reason).toBe('scan failed');
      expect(securityCheck.requestToken).toEqual('custom-token');
      expect(securityCheck.updatedAt).toEqual(updatedAt);
    });
  
    it('should initialize with all provided properties', () => {
      const updatedAt =  new Date();
      const securityCheck = new FileRecordSecurityCheckEmbeddable({
        status: undefined,
        reason: undefined,
        requestToken: undefined,
        updatedAt: undefined,
      });
      expect(securityCheck.status).toBe(ScanStatus.PENDING);
      expect(securityCheck.reason).toBe('not yet scanned');
      expect(securityCheck.requestToken).toBe(expect.any(String));
      expect(securityCheck.updatedAt).toEqual(expect.any(Date));
    });
  });
});
