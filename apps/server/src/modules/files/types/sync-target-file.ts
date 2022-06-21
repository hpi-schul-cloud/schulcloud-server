/* istanbul ignore file */

import { EntityId } from '@shared/domain';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class SyncTargetFile {
	id: EntityId;

	createdAt: Date;

	updatedAt: Date;

	constructor(props: SyncTargetFile) {
		this.id = props.id;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SyncTargetFileData = Record<string, any>;
