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
import type { CourseCommonCartridgeMetadataResponse } from '../models';
// @ts-ignore
import type { CreateCourseBodyParams } from '../models';
// @ts-ignore
import type { CreateCourseResponse } from '../models';
/**
 * CoursesApi - axios parameter creator
 * @export
 */
export const CoursesApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Create a new course.
         * @param {CreateCourseBodyParams} createCourseBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        courseControllerCreateCourse: async (createCourseBodyParams: CreateCourseBodyParams, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'createCourseBodyParams' is not null or undefined
            assertParamExists('courseControllerCreateCourse', 'createCourseBodyParams', createCourseBodyParams)
            const localVarPath = `/courses`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(createCourseBodyParams, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get common cartridge metadata of a course by Id.
         * @param {string} courseId The id of the course
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        courseControllerGetCourseCcMetadataById: async (courseId: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'courseId' is not null or undefined
            assertParamExists('courseControllerGetCourseCcMetadataById', 'courseId', courseId)
            const localVarPath = `/courses/{courseId}/cc-metadata`
                .replace(`{${"courseId"}}`, encodeURIComponent(String(courseId)));
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
 * CoursesApi - functional programming interface
 * @export
 */
export const CoursesApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = CoursesApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Create a new course.
         * @param {CreateCourseBodyParams} createCourseBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async courseControllerCreateCourse(createCourseBodyParams: CreateCourseBodyParams, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CreateCourseResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.courseControllerCreateCourse(createCourseBodyParams, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['CoursesApi.courseControllerCreateCourse']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * 
         * @summary Get common cartridge metadata of a course by Id.
         * @param {string} courseId The id of the course
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async courseControllerGetCourseCcMetadataById(courseId: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CourseCommonCartridgeMetadataResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.courseControllerGetCourseCcMetadataById(courseId, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['CoursesApi.courseControllerGetCourseCcMetadataById']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
    }
};

/**
 * CoursesApi - factory interface
 * @export
 */
export const CoursesApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = CoursesApiFp(configuration)
    return {
        /**
         * 
         * @summary Create a new course.
         * @param {CreateCourseBodyParams} createCourseBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        courseControllerCreateCourse(createCourseBodyParams: CreateCourseBodyParams, options?: any): AxiosPromise<CreateCourseResponse> {
            return localVarFp.courseControllerCreateCourse(createCourseBodyParams, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get common cartridge metadata of a course by Id.
         * @param {string} courseId The id of the course
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        courseControllerGetCourseCcMetadataById(courseId: string, options?: any): AxiosPromise<CourseCommonCartridgeMetadataResponse> {
            return localVarFp.courseControllerGetCourseCcMetadataById(courseId, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * CoursesApi - interface
 * @export
 * @interface CoursesApi
 */
export interface CoursesApiInterface {
    /**
     * 
     * @summary Create a new course.
     * @param {CreateCourseBodyParams} createCourseBodyParams 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoursesApiInterface
     */
    courseControllerCreateCourse(createCourseBodyParams: CreateCourseBodyParams, options?: RawAxiosRequestConfig): AxiosPromise<CreateCourseResponse>;

    /**
     * 
     * @summary Get common cartridge metadata of a course by Id.
     * @param {string} courseId The id of the course
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoursesApiInterface
     */
    courseControllerGetCourseCcMetadataById(courseId: string, options?: RawAxiosRequestConfig): AxiosPromise<CourseCommonCartridgeMetadataResponse>;

}

/**
 * CoursesApi - object-oriented interface
 * @export
 * @class CoursesApi
 * @extends {BaseAPI}
 */
export class CoursesApi extends BaseAPI implements CoursesApiInterface {
    /**
     * 
     * @summary Create a new course.
     * @param {CreateCourseBodyParams} createCourseBodyParams 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoursesApi
     */
    public courseControllerCreateCourse(createCourseBodyParams: CreateCourseBodyParams, options?: RawAxiosRequestConfig) {
        return CoursesApiFp(this.configuration).courseControllerCreateCourse(createCourseBodyParams, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get common cartridge metadata of a course by Id.
     * @param {string} courseId The id of the course
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoursesApi
     */
    public courseControllerGetCourseCcMetadataById(courseId: string, options?: RawAxiosRequestConfig) {
        return CoursesApiFp(this.configuration).courseControllerGetCourseCcMetadataById(courseId, options).then((request) => request(this.axios, this.basePath));
    }
}

