import { BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { BaseDO2, BaseDOProps, EntityId } from '@shared/domain';
import { ErrorType } from '../error';

export enum ScanStatus {
	PENDING = 'pending',
	VERIFIED = 'verified',
	BLOCKED = 'blocked',
	ERROR = 'error',
}

export enum FileRecordParentType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Submission' = 'submissions',
}

// TODO: Naming of params is wrong look like it is related to dto params
export interface IFileSecurityCheckParams {
	status: ScanStatus;
	reason: string;
	requestToken?: string;
	updatedAt: Date;
}

// We need to check how we work with keys from other collections, lile task.submission.coursegroup.
export interface IFileRecordParams extends BaseDOProps {
	id: EntityId;
	size: number;
	name: string;
	mimeType: string;
	parentType: FileRecordParentType;
	parentId: EntityId;
	schoolId: EntityId;
	securityCheck: IFileSecurityCheckParams;
	creatorId: EntityId;
	deletedSince?: Date;
}

interface IParentInfo {
	schoolId: EntityId;
	parentId: EntityId;
	parentType: FileRecordParentType;
}

export interface IUpdateSecurityCheckStatus {
	status: ScanStatus;
	reason: string;
}

export class FileRecord extends BaseDO2<IFileRecordParams> {
	public updateSecurityCheckStatus(scanStatus: IUpdateSecurityCheckStatus): void {
		this.props.securityCheck.status = scanStatus.status;
		this.props.securityCheck.reason = scanStatus.reason;
		this.props.securityCheck.updatedAt = new Date();
		this.props.securityCheck.requestToken = undefined;
	}

	// TODO: need test
	public getSecurityCheckToken(): string | undefined {
		return this.props.securityCheck.requestToken;
	}

	public copy(userId: EntityId, targetParentInfo: IParentInfo): IFileRecordParams {
		const { size, name, mimeType } = this.props;
		const { parentType, parentId, schoolId } = targetParentInfo;
		// TODO: wrong location for init, should be a constructor, builder, or factory
		// updatedAt should not be required
		const securityCheck: IFileSecurityCheckParams = this.isVerified()
			? this.props.securityCheck
			: {
					status: ScanStatus.PENDING,
					reason: 'not yet scanned',
					requestToken: uuid(),
					updatedAt: new Date(),
			  };

		const copyFileRecordParams = {
			size,
			name,
			mimeType,
			parentType,
			parentId,
			creatorId: userId,
			schoolId,
			securityCheck,
		};

		return copyFileRecordParams;
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

	public getParentInfo(): IParentInfo {
		const { parentId, parentType, schoolId } = this.props;

		return { parentId, parentType, schoolId };
	}

	public getSchoolId(): EntityId {
		return this.props.schoolId;
	}
}
