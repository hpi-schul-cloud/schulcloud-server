import { LogMessage } from '@core/logger';

export class H5pEditorContentCopySuccessfulLoggable {
	constructor(private readonly sourceContentId: string, private readonly copiedContentId: string) {}

	public getLogMessage(): LogMessage {
		return {
			message: 'Content successfully copied',
			data: {
				sourceContentId: this.sourceContentId,
				copiedContentId: this.copiedContentId,
			},
		};
	}
}
