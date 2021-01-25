import {HookContext} from "@feathersjs/feathers";

export const setHttpStatusCode = (status: number) => (context: HookContext) => {
    context.statusCode = status;
    return context;
}
