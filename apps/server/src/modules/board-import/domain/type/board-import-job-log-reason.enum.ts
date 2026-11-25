export enum BoardImportJobLogReason {
	MAX_ATTEMPTS = 'max-attempts',
	MAX_DURATION = 'max-duration',
	JOB_NOT_FOUND = 'job-not-found',
	JOB_CLOSED = 'job-closed',
	OUTDATED_ATTEMPT = 'outdated-attempt',
	JOB_UNREADABLE = 'job-unreadable',
	USER_NOT_FOUND = 'user-not-found',
	ACCOUNT_NOT_FOUND = 'account-not-found',
	ACCOUNT_DEACTIVATED = 'account-deactivated',
	BOARD_API_FORBIDDEN = 'board-api-forbidden',
}
