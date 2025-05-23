/* tslint:disable */
/* eslint-disable */
/**
 * Schulcloud-Verbund-Software Server API
 * This is v3 of Schulcloud-Verbund-Software Server. Checkout /docs for v1.
 *
 * The version of the OpenAPI document: 3.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import type { Configuration } from '../configuration';
import type { AxiosPromise, AxiosInstance, RawAxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from '../common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, type RequestArgs, BaseAPI, RequiredError, operationServerMap } from '../base';
// @ts-ignore
import type { LessonLinkedTaskResponse } from '../models';
// @ts-ignore
import type { LessonResponse } from '../models';
/**
 * LessonApi - axios parameter creator
 * @export
 */
export const LessonApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        lessonControllerGetLesson: async (lessonId: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'lessonId' is not null or undefined
            assertParamExists('lessonControllerGetLesson', 'lessonId', lessonId)
            const localVarPath = `/lessons/{lessonId}`
                .replace(`{${"lessonId"}}`, encodeURIComponent(String(lessonId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        lessonControllerGetLessonTasks: async (lessonId: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'lessonId' is not null or undefined
            assertParamExists('lessonControllerGetLessonTasks', 'lessonId', lessonId)
            const localVarPath = `/lessons/{lessonId}/tasks`
                .replace(`{${"lessonId"}}`, encodeURIComponent(String(lessonId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
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
 * LessonApi - functional programming interface
 * @export
 */
export const LessonApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = LessonApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async lessonControllerGetLesson(lessonId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<LessonResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.lessonControllerGetLesson(lessonId, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['LessonApi.lessonControllerGetLesson']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async lessonControllerGetLessonTasks(lessonId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<LessonLinkedTaskResponse>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.lessonControllerGetLessonTasks(lessonId, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['LessonApi.lessonControllerGetLessonTasks']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
    }
};

/**
 * LessonApi - factory interface
 * @export
 */
export const LessonApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = LessonApiFp(configuration)
    return {
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        lessonControllerGetLesson(lessonId: string, options?: any): AxiosPromise<LessonResponse> {
            return localVarFp.lessonControllerGetLesson(lessonId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @param {string} lessonId The id of the lesson.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        lessonControllerGetLessonTasks(lessonId: string, options?: any): AxiosPromise<Array<LessonLinkedTaskResponse>> {
            return localVarFp.lessonControllerGetLessonTasks(lessonId, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * LessonApi - object-oriented interface
 * @export
 * @class LessonApi
 * @extends {BaseAPI}
 */
export class LessonApi extends BaseAPI {
    /**
     * 
     * @param {string} lessonId The id of the lesson.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LessonApi
     */
    public lessonControllerGetLesson(lessonId: string, options?: RawAxiosRequestConfig) {
        return LessonApiFp(this.configuration).lessonControllerGetLesson(lessonId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @param {string} lessonId The id of the lesson.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LessonApi
     */
    public lessonControllerGetLessonTasks(lessonId: string, options?: RawAxiosRequestConfig) {
        return LessonApiFp(this.configuration).lessonControllerGetLessonTasks(lessonId, options).then((request) => request(this.axios, this.basePath));
    }
}

