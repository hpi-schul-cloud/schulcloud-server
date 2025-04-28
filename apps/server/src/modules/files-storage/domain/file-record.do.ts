import { PreviewInputMimeTypes } from '@infra/preview-generator';
import { BadRequestException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { ErrorType } from './error';
import { FileRecordParentType, StorageLocation } from './interface';

export enum PreviewOutputMimeTypes {
	IMAGE_WEBP = 'image/webp',
}

export interface FileRecordSecurityCheckProps {
	status: ScanStatus;
	reason: string;
	updatedAt: Date;
	requestToken?: string;
}

export class FileRecordSecurityCheck implements FileRecordSecurityCheckProps {
	public status: ScanStatus;

	public reason: string;

	public requestToken?: string;

	/** lastSyncedAt */
	public updatedAt: Date;

	constructor(props: FileRecordSecurityCheckProps) {
		this.status = props.status;
		this.reason = props.reason;
		this.updatedAt = props.updatedAt;
		this.requestToken = props.requestToken;
	}

	public static createWithDefaultProps(): FileRecordSecurityCheck {
		const props = {
			status: ScanStatus.PENDING,
			reason: 'not yet scanned',
			updatedAt: new Date(),
			requestToken: uuid(),
		};
		const securityCheck = new FileRecordSecurityCheck(props);

		return securityCheck;
	}

	public scanned(status: ScanStatus, reason: string): void {
		this.status = status;
		this.reason = reason;
		this.updatedAt = new Date();
		this.requestToken = undefined;
	}

	public isBlocked(): boolean {
		const isBlocked = this.status === ScanStatus.BLOCKED;

		return isBlocked;
	}

	public hasScanStatusWontCheck(): boolean {
		const hasWontCheckStatus = this.status === ScanStatus.WONT_CHECK;

		return hasWontCheckStatus;
	}

	public isPending(): boolean {
		const isPending = this.status === ScanStatus.PENDING;

		return isPending;
	}

	public isVerified(): boolean {
		const isVerified = this.status === ScanStatus.VERIFIED;

		return isVerified;
	}

	public copy(): FileRecordSecurityCheck {
		const copy = new FileRecordSecurityCheck({
			status: this.status,
			reason: this.reason,
			updatedAt: this.updatedAt,
			requestToken: this.requestToken,
		});

		return copy;
	}

	public getProps(): FileRecordSecurityCheckProps {
		const copyProps = { ...this };

		return copyProps;
	}
}

export interface ParentInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	WONT_CHECK = 'wont_check',
	ERROR = 'error',
}

export enum PreviewStatus {
	PREVIEW_POSSIBLE = 'preview_possible',
	AWAITING_SCAN_STATUS = 'awaiting_scan_status',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR = 'preview_not_possible_scan_status_error',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK = 'preview_not_possible_scan_status_wont_check',
	PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED = 'preview_not_possible_scan_status_blocked',
	PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE = 'preview_not_possible_wrong_mime_type',
}

export interface FileRecordProps extends AuthorizableObject {
	id: EntityId;
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	creatorId?: EntityId;
	storageLocation: StorageLocation;
	storageLocationId: EntityId;
	deletedSince?: Date;
	isCopyFrom?: EntityId;
	isUploading?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class FileRecord extends DomainObject<FileRecordProps> {
	private securityCheck: FileRecordSecurityCheck;

	constructor(props: FileRecordProps, securityCheck: FileRecordSecurityCheck) {
		super(props);
		this.securityCheck = securityCheck;
	}

	// --- should be part of a aggregate that contain a file-record array ---
	public static hasDuplicateName(fileRecords: FileRecord[], fileName: string): FileRecord | undefined {
		const foundFileRecord = fileRecords.find((item: FileRecord) => item.hasName(fileName));

		return foundFileRecord;
	}

	public static removeCreatorId(fileRecords: FileRecord[]): void {
		fileRecords.forEach((entity: FileRecord) => entity.removeCreatorId());
	}

	public static resolveFileNameDuplicates(fileRecords: FileRecord[], fileName: string): string {
		let counter = 0;
		const filenameObj = path.parse(fileName);
		let newFilename = fileName;

		while (FileRecord.hasDuplicateName(fileRecords, newFilename)) {
			counter += 1;
			newFilename = `${filenameObj.name} (${counter})${filenameObj.ext}`;
		}

		return newFilename;
	}

	public static markForDelete(fileRecords: FileRecord[]): void {
		fileRecords.forEach((fileRecord) => {
			fileRecord.markForDelete();
		});
	}

	public static unmarkForDelete(fileRecords: FileRecord[]): void {
		fileRecords.forEach((fileRecord) => {
			fileRecord.unmarkForDelete();
		});
	}

	public static getPaths(fileRecords: FileRecord[]): string[] {
		const paths = fileRecords.map((fileRecord) => fileRecord.createPath());

		return paths;
	}

	// ---------------------------------------------------------

	public static getFormat(mimeType: string): string {
		const format = mimeType.split('/')[1];

		if (!format) {
			throw new Error(`could not get format from mime type: ${mimeType}`);
		}

		return format;
	}

	public getSecurityCheckProps(): FileRecordSecurityCheckProps {
		const securityCheckProps = this.securityCheck.getProps();

		return securityCheckProps;
	}

	public createSecurityScanBasedOnStatus(): FileRecordSecurityCheck {
		const securityCheck = this.securityCheck.isVerified()
			? this.securityCheck.copy()
			: FileRecordSecurityCheck.createWithDefaultProps();

		return securityCheck;
	}

	get sizeInByte(): number {
		return this.props.size;
	}

	get mimeType(): string {
		return this.props.mimeType;
	}

	public updateSecurityCheckStatus(status: ScanStatus, reason: string): void {
		this.securityCheck.scanned(status, reason);
	}

	public getSecurityToken(): string | undefined {
		return this.securityCheck.requestToken;
	}

	public isBlocked(): boolean {
		return this.securityCheck.isBlocked();
	}

	public isPending(): boolean {
		return this.securityCheck.isPending();
	}

	public markForDelete(): void {
		this.props.deletedSince = new Date();
	}

	public unmarkForDelete(): void {
		this.props.deletedSince = undefined;
	}

	public setName(name: string): void {
		if (name.length === 0) {
			throw new BadRequestException(ErrorType.FILE_NAME_EMPTY);
		}

		this.props.name = name;
	}

	public hasName(name: string): boolean {
		const hasName = this.props.name === name;

		return hasName;
	}

	public getName(): string {
		return this.props.name;
	}

	public isPreviewPossible(): boolean {
		const isPreviewPossible = Object.values<string>(PreviewInputMimeTypes).includes(this.props.mimeType);

		return isPreviewPossible;
	}

	public getParentInfo(): ParentInfo {
		const { parentId, parentType, storageLocation, storageLocationId } = this.getProps();

		return { parentId, parentType, storageLocation, storageLocationId };
	}

	public getPreviewStatus(): PreviewStatus {
		if (this.securityCheck.isBlocked()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED;
		}

		if (!this.isPreviewPossible()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE;
		}

		if (this.securityCheck.isVerified()) {
			return PreviewStatus.PREVIEW_POSSIBLE;
		}

		if (this.securityCheck.isPending()) {
			return PreviewStatus.AWAITING_SCAN_STATUS;
		}

		if (this.securityCheck.hasScanStatusWontCheck()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK;
		}

		return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR;
	}

	get scanStatus(): ScanStatus {
		return this.securityCheck.status;
	}

	get fileNameWithoutExtension(): string {
		const filenameObj = path.parse(this.getName());

		return filenameObj.name;
	}

	public getPreviewName(outputFormat?: PreviewOutputMimeTypes): string {
		if (!outputFormat) {
			return this.props.name;
		}

		const format = FileRecord.getFormat(outputFormat);
		const previewFileName = `${this.fileNameWithoutExtension}.${format}`;

		return previewFileName;
	}

	public removeCreatorId(): void {
		this.props.creatorId = undefined;
	}

	private setSizeInByte(sizeInByte: number, maxSizeInByte: number): void {
		if (sizeInByte <= 0) {
			throw new BadRequestException(ErrorType.FILE_IS_EMPTY);
		}
		if (sizeInByte > maxSizeInByte) {
			throw new BadRequestException(ErrorType.FILE_TOO_BIG);
		}
		this.props.size = sizeInByte;
	}

	public markAsUploaded(sizeInByte: number, maxSizeInByte: number): void {
		this.setSizeInByte(sizeInByte, maxSizeInByte);
		this.props.isUploading = undefined;
	}

	public createPath(): string {
		const path = [this.props.storageLocationId, this.id].join('/');

		return path;
	}

	public createPreviewDirectoryPath(): string {
		const path = ['previews', this.props.storageLocationId, this.id].join('/');

		return path;
	}

	public createPreviewFilePath(hash: string): string {
		const folderPath = this.createPreviewDirectoryPath();
		const filePath = [folderPath, hash].join('/');

		return filePath;
	}
}
