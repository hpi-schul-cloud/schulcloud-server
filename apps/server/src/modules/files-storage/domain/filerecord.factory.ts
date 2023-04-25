import type { EntityId } from '@shared/domain';
import { BaseDOFactory } from '@shared/domain/base-do.factory';
// TODO: import order is a problem, das dto muss durch das export/import interface ersetzt werden Ticket: BC-1268
import type { FileRecordParams as FileRecordParamsDto } from '../controller/dto';
import type { FileDto } from '../dto';
import { FileRecord, type FileRecordParams, type FileSecurityCheckParams, ScanStatus } from './filerecord.do';

export class FileRecordFactory extends BaseDOFactory<FileRecordParams, FileRecord> {
	private static singelton: FileRecordFactory;

	public static getInstance() {
		if (!FileRecordFactory.singelton) {
			FileRecordFactory.singelton = new FileRecordFactory();
		}

		return FileRecordFactory.singelton;
	}

	// TODO: outsource build if possible
	// TODO: we want to use it also if id is in props for mapper
	public build(props: FileRecordParams): FileRecord {
		// const propsWithId = this.assignProps(props);
		const fileRercord = new FileRecord(props);

		return fileRercord;
	}

	public buildSecurityCheckProperties(): FileSecurityCheckParams {
		const securityCheckProperties: FileSecurityCheckParams = {
			status: ScanStatus.PENDING,
			reason: 'not yet scanned', // const
			requestToken: this.createUUID(),
			updatedAt: new Date(), // TODO: can be possible move to factory
		};

		return securityCheckProperties;
	}

	public buildFromDtos(
		name: string,
		creatorId: EntityId,
		params: FileRecordParamsDto,
		fileDescription: FileDto
	): FileRecord {
		const id = this.createId(); // can also be moved to do
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
}
