export type LogMessageDataObject = {
	[key: string]: LogMessageData;
};

export type LogMessageData = LogMessageDataObject | string | number | boolean | undefined;
