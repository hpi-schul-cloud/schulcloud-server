import { ManagerOptions, SocketOptions } from 'socket.io-client';

export type UrlConfiguration = {
	websocket: string;
	api: string;
	web: string;
};

export type UserProfile = {
	name: string;
	sleepMs: number;
	maxCards: number;
};

export type UserProfileWithAmount = {
	name: string;
	sleepMs: number;
	maxCards: number;
	amount: number;
};

export type ClassDefinition = {
	name: string;
	users: UserProfileWithAmount[];
};

export type ClassDefinitionWithAmount = {
	classDefinition: ClassDefinition;
	amount: number;
};

export type Configuration = {
	amount: number;
	classDefinition: ClassDefinition;
};

export type ResponseTimeRecord = {
	action: string;
	responseTime: number;
};

export type SocketConfiguration = {
	path: string;
	baseUrl: string;
	token: string;
	connectTimeout?: number;
	options?: Partial<ManagerOptions & SocketOptions>;
};
