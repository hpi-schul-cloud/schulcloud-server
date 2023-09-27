export type CreationProtocolEntityType = 'school' | 'password' | 'postfix' | 'user' | 'course' | 'lesson';

export type CreationProtocol = {
	id: string | undefined;
	key: string | undefined;
	type: CreationProtocolEntityType;
	children?: CreationProtocol[];
};
