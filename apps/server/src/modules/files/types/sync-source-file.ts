/* istanbul ignore file */

import { EntityId } from '@shared/domain';
import { ScanStatus } from '@src/modules/files-storage/repo/filerecord.entity';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class SyncSourceFile {
	id: EntityId;

	name: string;

	size: number;

	type: string;

	storageFileName: string;

	bucket: string;

	storageProviderId: EntityId;

	securityCheck?: SyncSourceFileSecurityCheck;

	permissions?: SyncSourceFilePermission[];

	createdAt: Date;

	updatedAt: Date;

	deletedAt?: Date;

	constructor(props: SyncSourceFile) {
		this.id = props.id;
		this.name = props.name;
		this.size = props.size;
		this.type = props.type;
		this.storageFileName = props.storageFileName;
		this.bucket = props.bucket;
		this.storageProviderId = props.storageProviderId;
		this.securityCheck = props.securityCheck;
		this.permissions = props.permissions;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.deletedAt = props.deletedAt;
	}
}

export class SyncSourceFileSecurityCheck {
	status: ScanStatus;

	reason: string;

	requestToken: string;

	createdAt: Date;

	updatedAt: Date;

	constructor(props: SyncSourceFileSecurityCheck) {
		this.status = props.status;
		this.reason = props.reason;
		this.requestToken = props.requestToken;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

export class SyncSourceFilePermission {
	refId: EntityId;

	refPermModel: string;

	write: boolean;

	read: boolean;

	create: boolean;

	delete: boolean;

	constructor(props: SyncSourceFilePermission) {
		this.refId = props.refId;
		this.refPermModel = props.refPermModel;
		this.write = props.write;
		this.read = props.read;
		this.create = props.create;
		this.delete = props.delete;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SyncSourceFileData = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FileSecurityCheckData = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilePermissionData = Record<string, any>;
