export enum SecurityCheckStatus {
	PENDING = 'pending',
	PASSED = 'passed',
	FAILED = 'failed',
	BLOCKED = 'blocked',
}
interface SecurityCheck {
	status: SecurityCheckStatus;
}
export interface LegacyFileResponse {
	_id: string;
	name: string;
	isDirectory: boolean;
	parent?: string;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: string;
	securityCheck?: SecurityCheck;
}
