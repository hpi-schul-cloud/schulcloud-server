import { Class } from '../../domain/class';

export interface ClassRepo {
	getClassesForSchool(schoolId: string, sortOrder?: number): Promise<Class[]>;

	getClassesByIds(classIds: string[]): Promise<Class[]>;
}

export const CLASS_REPO = 'CLASS_REPO';
