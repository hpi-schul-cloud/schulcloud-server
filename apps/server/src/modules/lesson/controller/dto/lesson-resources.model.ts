export class LessonResources {
    client: string;
    description: string;
    merlinReference?: string;
    title: string;
    url: string;

    constructor(client: string, description: string, title: string, url: string, merlinReference?: string) {
        this.client = client;
        this.description = description;
        this.title = title;
        this.url = url;
        this.merlinReference = merlinReference;
    }
}