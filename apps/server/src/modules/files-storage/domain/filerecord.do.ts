import { BadRequestException } from '@nestjs/common';
import { BaseDO2, BaseDOProps, EntityId } from '@shared/domain';
import { ErrorType } from '../error';
import { FileRecordParentType } from '../interface';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	ERROR = 'error',
}

// TODO: Naming of params is wrong look like it is related to dto params
export interface FileSecurityCheckParams {
	status: ScanStatus;
	reason: string;
	requestToken?: string;
	updatedAt: Date;
}

// We need to check how we work with keys from other collections, lile task.submission.coursegroup.
export interface FileRecordParams extends BaseDOProps {
	id: EntityId;
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	schoolId: EntityId;
	securityCheck: FileSecurityCheckParams;
	creatorId: EntityId;
	deletedSince?: Date;
}

export interface FileRecordParentInfo {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export interface IUpdateSecurityCheckStatus {
	status: ScanStatus;
	reason: string;
}

export class FileRecord extends BaseDO2<FileRecordParams> {
	public updateSecurityCheckStatus(scanStatus: IUpdateSecurityCheckStatus): void {
		this.props.securityCheck.status = scanStatus.status;
		this.props.securityCheck.reason = scanStatus.reason;
		this.props.securityCheck.updatedAt = new Date();
		this.props.securityCheck.requestToken = undefined;
	}

	public getSecurityCheckToken(): string | undefined {
		return this.props.securityCheck.requestToken;
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

	public isBlocked(): boolean {
		const isBlocked = this.props.securityCheck.status === ScanStatus.BLOCKED;

		return isBlocked;
	}

	public isPending(): boolean {
		const isPending = this.props.securityCheck.status === ScanStatus.PENDING;

		return isPending;
	}

	public isVerified(): boolean {
		const isVerified = this.props.securityCheck.status === ScanStatus.VERIFIED;

		return isVerified;
	}

	public getParentInfo(): FileRecordParentInfo {
		const { parentId, parentType, schoolId } = this.props;

		return { parentId, parentType, schoolId };
	}

	public getSchoolId(): EntityId {
		return this.props.schoolId;
	}
}
