export interface NextcloudGroups {
	groups: string[];
}

export interface OcsResponse<T = unknown> {
	ocs: {
		data: T;
		meta: Meta;
	};
}

export interface Meta {
	status: string;
	statuscode: number;
	message: string;
	totalitems: string;
	itemsperpage: string;
}

export interface SuccessfulRes {
	success: boolean;
}

export interface GroupUsers {
	users: string[];
}

// Groupfolders Responses

export interface GroupfoldersFolder {
	folder_id: number;
}

export interface GroupfoldersCreated {
	id: number;
}
