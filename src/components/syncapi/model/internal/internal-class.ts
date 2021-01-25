import {CallerClassModel} from "../caller/caller-class";

export class InternalClassModel {
    id: string;
    name: string;
    schoolId: string;
    displayName: string;
    description: string;
    userIds?:string[];
    teacherIds?:string[];
}
