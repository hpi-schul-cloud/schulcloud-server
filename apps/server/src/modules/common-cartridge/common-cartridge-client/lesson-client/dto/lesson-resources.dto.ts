import { LessonResources } from '../lessons-api-client';
export class LessonResourcesDto {
    
    client: string;
    
    description: string;
    
    merlinReference: string;
    
    title: string;
    
    url: string;

    constructor(lessonResources: LessonResources) {
        this.client = lessonResources.client;
        this.description = lessonResources.description;
        this.merlinReference = lessonResources.merlinReference;
        this.title = lessonResources.title;
        this.url = lessonResources.url;
    }
}