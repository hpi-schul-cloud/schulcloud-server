
import { errormapper, entityIdMapper } from somewhere;

export interface Loggable {
	getLogMessage(): unknown; // todo: how to type this
}

export interface Throwable extends Loggable {
	getError();
}

// \apps\server\src\modules\files\uc\delete-orphaned-files.uc.ts ll 
export class OrphanDeleteFailedThrowable implements Throwable, Loggable {
	constructor (originalfile: File, orphan: File, originalAxiosError: Error) {}

	getLogMessage() {
		return {
			message: 'deleting orphaned file has failed',
			data: {
				orphanFileId: orphan.id
			}
		}
	}
	getError(){
		// TODO: define error format
		return {
			errorcode: 'asdpaspidjasd',
			httpcode: '500'
		}
	}
}

// todo: how to handle "I dont know what error is coming"

throw(OrphanDeleteFailedThrowable)
logger.error(OrphanDeleteFailedThrowable)