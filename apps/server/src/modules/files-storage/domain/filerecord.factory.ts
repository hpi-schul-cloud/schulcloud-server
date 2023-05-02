import type { EntityId } from '@shared/domain';
import { BaseDOFactory } from '@shared/domain/base-do.factory';
// TODO: import order is a problem, das dto muss durch das export/import interface ersetzt werden Ticket: BC-1268
import type { FileRecordParams as FileRecordParamsDto } from '../controller/dto';
import type { FileDto } from '../dto';
import {
	FileRecord,
	type FileRecordParams,
	type FileSecurityCheckParams,
	ScanStatus,
	type FileRecordParentInfo,
} from './filerecord.do';

class FileRecordFactory extends BaseDOFactory<FileRecordParams, FileRecord> {
	public build(props: FileRecordParams): FileRecord {
		const fileRercord = new FileRecord(props);

		return fileRercord;
	}

	public buildSecurityCheckProperties(scanStatus?: ScanStatus, scanReason?: string): FileSecurityCheckParams {
		const status = scanStatus || ScanStatus.PENDING;
		const reason = scanReason || 'not yet scanned'; // const
		const securityCheckProperties: FileSecurityCheckParams = {
			status,
			reason,
			requestToken: this.createUuid(),
			updatedAt: new Date(), // TODO: can be possible move to factory
		};

		return securityCheckProperties;
	}

	public buildFromDtos(
		creatorId: EntityId,
		params: FileRecordParamsDto,
		fileDescription: FileDto,
		name: string
	): FileRecord {
		const id = this.createId();
		const securityCheckProperties = this.buildSecurityCheckProperties();
		const fileRecordParams: FileRecordParams = {
			id,
			name,
			size: 100, // TODO: Fix me!
			mimeType: fileDescription.mimeType,
			parentType: params.parentType,
			parentId: params.parentId,
			creatorId,
			schoolId: params.schoolId,
			securityCheck: securityCheckProperties,
		};

		const fileRecord = this.build(fileRecordParams);

		return fileRecord;
	}

	// Hint: must be move to this place, the factory can not be used inside of the fileRecord, because the factory has already a dependency to fileRecord
	public copy(userId: EntityId, sourceFileRecord: FileRecord, targetParentInfo: FileRecordParentInfo): FileRecord {
		const { size, name, mimeType, securityCheck: sourceSecurityCheck } = sourceFileRecord.getProps();
		const { parentType, parentId, schoolId } = targetParentInfo;
		const sourceFileRecordIsVerified = sourceFileRecord.isVerified();
		const securityCheck = sourceFileRecordIsVerified ? sourceSecurityCheck : this.buildSecurityCheckProperties();
		const id = this.createId();

		const copyFileRecordParams: FileRecordParams = {
			id,
			size,
			name,
			mimeType,
			parentType,
			parentId,
			creatorId: userId,
			schoolId,
			securityCheck,
		};

		const copyFileRecord = this.build(copyFileRecordParams);

		return copyFileRecord;
	}
}

export const fileRecordFactory = new FileRecordFactory();
