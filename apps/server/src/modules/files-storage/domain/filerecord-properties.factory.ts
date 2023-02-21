import { EntityId } from '@shared/domain';
import { v4 as uuid } from 'uuid';
import type { FileRecordParams } from '../controller/dto';
import type { FileDto } from '../dto';
import { IFileRecordParams, IFileSecurityCheckParams, ScanStatus } from './filerecord.do';

// TODO: should be also used for fileRecord.copy actions, but dependecy cycle
// TODO: no clean line up to entity default values atm
// Note: can also be used for buildTask() buildDraftTask() ... chains
// Note: can be used for test repo.create(params) inputs, because every variation should be represented on this place
export class FileRecordPropertiesFactory {
	/*
	private static build(params: IFileRecordParams): IFileRecordParams {
		const fileRecordParams: IFileRecordParams = params;

		return fileRecordParams;
	}
	*/
	// TODO: must be based on domain layer
	public static buildSecurityCheckProperties(): IFileSecurityCheckParams {
		const securityCheckProperties: IFileSecurityCheckParams = {
			status: ScanStatus.PENDING,
			reason: 'not yet scanned',
			requestToken: uuid(),
			updatedAt: new Date(),
		};

		return securityCheckProperties;
	}

	public static buildFromDtos(
		name: string,
		creatorId: EntityId,
		params: FileRecordParams,
		fileDescription: FileDto
	): IFileRecordParams {
		const securityCheckProperties = FileRecordPropertiesFactory.buildSecurityCheckProperties();
		const fileRecordParams: IFileRecordParams = {
			name,
			size: fileDescription.size,
			mimeType: fileDescription.mimeType,
			parentType: params.parentType,
			parentId: params.parentId,
			creatorId,
			schoolId: params.schoolId,
			securityCheck: securityCheckProperties,
		};

		return fileRecordParams;
	}
}
