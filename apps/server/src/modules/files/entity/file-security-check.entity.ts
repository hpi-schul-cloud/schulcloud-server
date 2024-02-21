import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { FileSecurityCheckStatus } from '../domain';

export interface FileSecurityCheckEntityProps {
	status?: FileSecurityCheckStatus;
	reason?: string;
	requestToken?: string;
}

@Embeddable()
export class FileSecurityCheckEntity {
	@Enum()
	status: FileSecurityCheckStatus = FileSecurityCheckStatus.PENDING;

	@Property()
	reason = 'not yet scanned';

	@Property()
	requestToken?: string = uuid();

	@Property({ type: Date })
	createdAt = new Date();

	@Property({ type: Date, onUpdate: () => new Date() })
	updatedAt = new Date();

	constructor(props: FileSecurityCheckEntityProps) {
		if (props.status !== undefined) {
			this.status = props.status;
		}

		if (props.reason !== undefined) {
			this.reason = props.reason;
		}

		if (props.requestToken !== undefined) {
			this.requestToken = props.requestToken;
		}
	}
}
