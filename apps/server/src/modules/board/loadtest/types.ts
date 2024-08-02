export type UrlConfiguration = {
	websocket: string;
	api: string;
	web: string;
};

export type UserProfile = {
	name: string;
	sleepMs: number;
	maxCards: number;
	amount?: number | undefined;
};

export type ClassDefinition = {
	name: string;
	users: UserProfile[];
};

export type Configuration = {
	amount: number;
	classDefinition: ClassDefinition;
};

export type ResponseTimeRecord = {
	action: string;
	responseTime: number;
};
