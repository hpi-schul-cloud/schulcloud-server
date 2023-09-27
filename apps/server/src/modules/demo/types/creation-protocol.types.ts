export enum CreationProtocolEntityType {
	SCHOOL = 'SCHOOL',
	PASSWORD = 'PASSWORD',
	POSTFIX = 'POSTFIX',
	USER = 'USER',
	COURSE = 'COURSE',
	LESSON = 'LESSON',
}

export type CreationProtocol = {
	id: string | undefined;
	key: string | undefined;
	type: CreationProtocolEntityType;
	children?: CreationProtocol[];
};
