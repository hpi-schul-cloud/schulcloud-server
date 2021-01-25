import {Request} from "express";

export class GroupUtils {
    static mapHeader(req: Request, method: string): RequestInit {
        const headers: Headers = new Headers();
        headers.set("Authorization", req.headers.authorization);
        headers.set("Content-Type", req.headers["content-type"]);
        return {headers, method: method || req.method};
    }
}
