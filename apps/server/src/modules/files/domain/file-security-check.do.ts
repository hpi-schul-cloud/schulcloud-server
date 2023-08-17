import cloneDeep from 'lodash/cloneDeep';

import { FileSecurityCheckStatus } from './types';

export interface FileSecurityCheckProps {
	createdAt: Date;
	updatedAt: Date;
	status: FileSecurityCheckStatus;
	reason: string;
	requestToken?: string;
}

export class FileSecurityCheck {
	protected props: FileSecurityCheckProps;

	constructor(props: FileSecurityCheckProps) {
		this.props = props;
	}

	public getProps(): FileSecurityCheckProps {
		return cloneDeep(this.props);
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get status(): FileSecurityCheckStatus {
		return this.props.status;
	}

	get reason(): string {
		return this.props.reason;
	}

	get requestToken(): string | undefined {
		return this.props.requestToken;
	}
}
