/* tslint:disable */
/* eslint-disable */
/**
 * Etherpad API
 * Etherpad is a real-time collaborative editor scalable to thousands of simultaneous real time users. It provides full data export capabilities, and runs on your server, under your control.
 *
 * The version of the OpenAPI document: 1.3.0
 * Contact: support@example.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
import { Configuration } from '../configuration';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from '../common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from '../base';
// @ts-ignore
import { InlineResponse2001 } from '../models';
// @ts-ignore
import { InlineResponse2004 } from '../models';
// @ts-ignore
import { InlineResponse2005 } from '../models';
// @ts-ignore
import { InlineResponse400 } from '../models';
// @ts-ignore
import { InlineResponse401 } from '../models';
// @ts-ignore
import { InlineResponse500 } from '../models';
/**
 * SessionApi - axios parameter creator
 * @export
 */
export const SessionApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSessionUsingGET: async (groupID?: string, authorID?: string, validUntil?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/createSession`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (groupID !== undefined) {
                localVarQueryParameter['groupID'] = groupID;
            }

            if (authorID !== undefined) {
                localVarQueryParameter['authorID'] = authorID;
            }

            if (validUntil !== undefined) {
                localVarQueryParameter['validUntil'] = validUntil;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSessionUsingPOST: async (groupID?: string, authorID?: string, validUntil?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/createSession`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (groupID !== undefined) {
                localVarQueryParameter['groupID'] = groupID;
            }

            if (authorID !== undefined) {
                localVarQueryParameter['authorID'] = authorID;
            }

            if (validUntil !== undefined) {
                localVarQueryParameter['validUntil'] = validUntil;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteSessionUsingGET: async (sessionID?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/deleteSession`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (sessionID !== undefined) {
                localVarQueryParameter['sessionID'] = sessionID;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteSessionUsingPOST: async (sessionID?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/deleteSession`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (sessionID !== undefined) {
                localVarQueryParameter['sessionID'] = sessionID;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSessionInfoUsingGET: async (sessionID?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/getSessionInfo`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (sessionID !== undefined) {
                localVarQueryParameter['sessionID'] = sessionID;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSessionInfoUsingPOST: async (sessionID?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/getSessionInfo`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication ApiKey required
            await setApiKeyToObject(localVarQueryParameter, "apikey", configuration)

            if (sessionID !== undefined) {
                localVarQueryParameter['sessionID'] = sessionID;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * SessionApi - functional programming interface
 * @export
 */
export const SessionApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = SessionApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async createSessionUsingGET(groupID?: string, authorID?: string, validUntil?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2004>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.createSessionUsingGET(groupID, authorID, validUntil, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async createSessionUsingPOST(groupID?: string, authorID?: string, validUntil?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2004>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.createSessionUsingPOST(groupID, authorID, validUntil, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteSessionUsingGET(sessionID?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2001>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteSessionUsingGET(sessionID, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteSessionUsingPOST(sessionID?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2001>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteSessionUsingPOST(sessionID, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSessionInfoUsingGET(sessionID?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2005>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSessionInfoUsingGET(sessionID, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSessionInfoUsingPOST(sessionID?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2005>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSessionInfoUsingPOST(sessionID, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * SessionApi - factory interface
 * @export
 */
export const SessionApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = SessionApiFp(configuration)
    return {
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSessionUsingGET(groupID?: string, authorID?: string, validUntil?: string, options?: any): AxiosPromise<InlineResponse2004> {
            return localVarFp.createSessionUsingGET(groupID, authorID, validUntil, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary creates a new session. validUntil is an unix timestamp in seconds
         * @param {string} [groupID] 
         * @param {string} [authorID] 
         * @param {string} [validUntil] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSessionUsingPOST(groupID?: string, authorID?: string, validUntil?: string, options?: any): AxiosPromise<InlineResponse2004> {
            return localVarFp.createSessionUsingPOST(groupID, authorID, validUntil, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteSessionUsingGET(sessionID?: string, options?: any): AxiosPromise<InlineResponse2001> {
            return localVarFp.deleteSessionUsingGET(sessionID, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary deletes a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteSessionUsingPOST(sessionID?: string, options?: any): AxiosPromise<InlineResponse2001> {
            return localVarFp.deleteSessionUsingPOST(sessionID, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSessionInfoUsingGET(sessionID?: string, options?: any): AxiosPromise<InlineResponse2005> {
            return localVarFp.getSessionInfoUsingGET(sessionID, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary returns information about a session
         * @param {string} [sessionID] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSessionInfoUsingPOST(sessionID?: string, options?: any): AxiosPromise<InlineResponse2005> {
            return localVarFp.getSessionInfoUsingPOST(sessionID, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * SessionApi - interface
 * @export
 * @interface SessionApi
 */
export interface SessionApiInterface {
    /**
     * 
     * @summary creates a new session. validUntil is an unix timestamp in seconds
     * @param {string} [groupID] 
     * @param {string} [authorID] 
     * @param {string} [validUntil] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    createSessionUsingGET(groupID?: string, authorID?: string, validUntil?: string, options?: any): AxiosPromise<InlineResponse2004>;

    /**
     * 
     * @summary creates a new session. validUntil is an unix timestamp in seconds
     * @param {string} [groupID] 
     * @param {string} [authorID] 
     * @param {string} [validUntil] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    createSessionUsingPOST(groupID?: string, authorID?: string, validUntil?: string, options?: any): AxiosPromise<InlineResponse2004>;

    /**
     * 
     * @summary deletes a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    deleteSessionUsingGET(sessionID?: string, options?: any): AxiosPromise<InlineResponse2001>;

    /**
     * 
     * @summary deletes a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    deleteSessionUsingPOST(sessionID?: string, options?: any): AxiosPromise<InlineResponse2001>;

    /**
     * 
     * @summary returns information about a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    getSessionInfoUsingGET(sessionID?: string, options?: any): AxiosPromise<InlineResponse2005>;

    /**
     * 
     * @summary returns information about a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApiInterface
     */
    getSessionInfoUsingPOST(sessionID?: string, options?: any): AxiosPromise<InlineResponse2005>;

}

/**
 * SessionApi - object-oriented interface
 * @export
 * @class SessionApi
 * @extends {BaseAPI}
 */
export class SessionApi extends BaseAPI implements SessionApiInterface {
    /**
     * 
     * @summary creates a new session. validUntil is an unix timestamp in seconds
     * @param {string} [groupID] 
     * @param {string} [authorID] 
     * @param {string} [validUntil] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public createSessionUsingGET(groupID?: string, authorID?: string, validUntil?: string, options?: any) {
        return SessionApiFp(this.configuration).createSessionUsingGET(groupID, authorID, validUntil, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary creates a new session. validUntil is an unix timestamp in seconds
     * @param {string} [groupID] 
     * @param {string} [authorID] 
     * @param {string} [validUntil] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public createSessionUsingPOST(groupID?: string, authorID?: string, validUntil?: string, options?: any) {
        return SessionApiFp(this.configuration).createSessionUsingPOST(groupID, authorID, validUntil, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary deletes a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public deleteSessionUsingGET(sessionID?: string, options?: any) {
        return SessionApiFp(this.configuration).deleteSessionUsingGET(sessionID, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary deletes a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public deleteSessionUsingPOST(sessionID?: string, options?: any) {
        return SessionApiFp(this.configuration).deleteSessionUsingPOST(sessionID, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary returns information about a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public getSessionInfoUsingGET(sessionID?: string, options?: any) {
        return SessionApiFp(this.configuration).getSessionInfoUsingGET(sessionID, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary returns information about a session
     * @param {string} [sessionID] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public getSessionInfoUsingPOST(sessionID?: string, options?: any) {
        return SessionApiFp(this.configuration).getSessionInfoUsingPOST(sessionID, options).then((request) => request(this.axios, this.basePath));
    }
}