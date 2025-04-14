import { PreviewInputMimeTypes } from '@infra/preview-generator';
import { BadRequestException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { ErrorType } from './error';
import { FileRecordParentType, StorageLocation } from './interface';

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

	public hasScanStatusError(): boolean {
		const hasError = this.status === ScanStatus.ERROR;

		return hasError;
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
	securityCheck: FileRecordSecurityCheck;
	createdAt: Date;
	updatedAt: Date;
}

export class FileRecord extends DomainObject<FileRecordProps> {
	constructor(props: FileRecordProps) {
		super(props);
	}

	public getProps(): FileRecordProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get size(): number {
		return this.props.size;
	}

	set size(value: number) {
		this.props.size = value;
	}

	get name(): string {
		return this.props.name;
	}

	set name(value: string) {
		this.props.name = value;
	}

	get mimeType(): string {
		return this.props.mimeType;
	}
	set mimeType(value: string) {
		this.props.mimeType = value;
	}

	get parentType(): FileRecordParentType {
		return this.props.parentType;
	}

	set parentType(value: FileRecordParentType) {
		this.props.parentType = value;
	}

	get parentId(): EntityId {
		return this.props.parentId;
	}

	set parentId(value: EntityId) {
		this.props.parentId = value;
	}

	get creatorId(): EntityId | undefined {
		return this.props.creatorId;
	}

	set creatorId(value: EntityId | undefined) {
		this.props.creatorId = value;
	}

	get storageLocation(): StorageLocation {
		return this.props.storageLocation;
	}

	set storageLocation(value: StorageLocation) {
		this.props.storageLocation = value;
	}

	get storageLocationId(): EntityId {
		return this.props.storageLocationId;
	}

	set storageLocationId(value: EntityId) {
		this.props.storageLocationId = value;
	}

	get deletedSince(): Date | undefined {
		return this.props.deletedSince;
	}

	set deletedSince(value: Date | undefined) {
		this.props.deletedSince = value;
	}

	get isCopyFrom(): EntityId | undefined {
		return this.props.isCopyFrom;
	}

	set isCopyFrom(value: EntityId | undefined) {
		this.props.isCopyFrom = value;
	}

	get isUploading(): boolean | undefined {
		return this.props.isUploading;
	}

	set isUploading(value: boolean | undefined) {
		this.props.isUploading = value;
	}

	get securityCheck(): FileRecordSecurityCheck {
		return this.props.securityCheck;
	}

	set securityCheck(value: FileRecordSecurityCheck) {
		this.props.securityCheck = value;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public updateSecurityCheckStatus(status: ScanStatus, reason: string): void {
		this.props.securityCheck.scanned(status, reason);
	}

	public getSecurityToken(): string | undefined {
		return this.props.securityCheck.requestToken;
	}

	public isBlocked(): boolean {
		return this.props.securityCheck.isBlocked();
	}

	public hasScanStatusError(): boolean {
		return this.props.securityCheck.hasScanStatusError();
	}

	public hasScanStatusWontCheck(): boolean {
		return this.props.securityCheck.hasScanStatusWontCheck();
	}

	public isPending(): boolean {
		return this.props.securityCheck.isPending();
	}

	public isVerified(): boolean {
		return this.props.securityCheck.isVerified();
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
		if (this.isBlocked()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_BLOCKED;
		}

		if (!this.isPreviewPossible()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE;
		}

		if (this.isVerified()) {
			return PreviewStatus.PREVIEW_POSSIBLE;
		}

		if (this.isPending()) {
			return PreviewStatus.AWAITING_SCAN_STATUS;
		}

		if (this.hasScanStatusWontCheck()) {
			return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK;
		}

		return PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_ERROR;
	}

	get fileNameWithoutExtension(): string {
		const filenameObj = path.parse(this.getName());

		return filenameObj.name;
	}

	public removeCreatorId(): void {
		this.props.creatorId = undefined;
	}

	public markAsUploaded(): void {
		this.props.isUploading = undefined;
	}
}
