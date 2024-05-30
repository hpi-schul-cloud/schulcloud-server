export interface RoleRepo {
	getNameForId(id: string): Promise<string>;
}

export const ROLE_REPO = 'ROLE_REPO';
