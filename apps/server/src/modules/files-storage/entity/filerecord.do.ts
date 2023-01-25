// TODO: rename folder from entity to domain
import { BadRequestException } from '@nestjs/common';
import { BaseDO2, EntityId } from '@shared/domain';
import { ErrorType } from '../error';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
}

export interface FileSecurityCheckParams {
	status: ScanStatus;
	reason: string;
	requestToken?: string;
	createdAt: Date;
	updatedAt: Date;
}

// We need to check how we work with keys from other collections, lile task.submission.coursegroup.
export type FileRecordDOParams = {
	id?: EntityId;
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	// lockedForUserId: EntityId;
	schoolId: EntityId;
	securityCheck?: FileSecurityCheckParams;
	creatorId: EntityId;
	deletedSince?: Date;
};

export class FileRecordDO extends BaseDO2<FileRecordDOParams> {
	updateSecurityCheckStatus(status: ScanStatus, reason = 'Clean'): void {
		// the if check is bad
		if (this.props.securityCheck) {
			this.props.securityCheck.status = status;
			this.props.securityCheck.reason = reason;
			this.props.securityCheck.updatedAt = new Date();
			this.props.securityCheck.requestToken = undefined;
		}
	}

	isBlocked(): boolean {
		const isBlocked = this.props.securityCheck?.status === ScanStatus.BLOCKED;

		return isBlocked;
	}

	isPending(): boolean {
		const isPending = this.props.securityCheck?.status === ScanStatus.PENDING;

		return isPending;
	}

	isVerified(): boolean {
		const isVerified = this.props.securityCheck?.status === ScanStatus.VERIFIED;

		return isVerified;
	}

	markForDelete(): void {
		this.props.deletedSince = new Date();
	}

	unmarkForDelete(): void {
		this.props.deletedSince = undefined;
	}

	setName(name: string): void {
		if (name.length === 0) {
			throw new BadRequestException(ErrorType.FILE_NAME_EMPTY);
		}

		this.props.name = name;
	}

	hasSameName(name: string): boolean {
		const hasSameName = this.props.name === name;

		return hasSameName;
	}

	getSchoolId(): EntityId {
		return this.props.schoolId;
	}

	getName(): string {
		return this.props.name;
	}

	// TODO: undefined is bad
	getSecurityCheck(): FileSecurityCheckParams | undefined {
		return this.props.securityCheck;
	}

	getSecurityCheckToken(): string | undefined {
		return this.props.securityCheck?.requestToken;
	}

	getParent(): { parentType: FileRecordParentType; parentId: EntityId } {
		const { parentId, parentType } = this.props;

		return { parentId, parentType };
	}

	getDescriptions(): { size: number; name: string; mimeType: string } {
		const { size, name, mimeType } = this.props;

		return { size, name, mimeType };
	}
}
