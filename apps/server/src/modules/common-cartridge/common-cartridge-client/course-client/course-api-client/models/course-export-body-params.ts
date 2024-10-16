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



/**
 * 
 * @export
 * @interface CourseExportBodyParams
 */
export interface CourseExportBodyParams {
    /**
     * The list of ids of topics which should be exported. If empty no topics are exported.
     * @type {Array<string>}
     * @memberof CourseExportBodyParams
     */
    'topics': Array<string>;
    /**
     * The list of ids of tasks which should be exported. If empty no tasks are exported.
     * @type {Array<string>}
     * @memberof CourseExportBodyParams
     */
    'tasks': Array<string>;
    /**
     * The list of ids of column boards which should be exported. If empty no column boards are exported.
     * @type {Array<string>}
     * @memberof CourseExportBodyParams
     */
    'columnBoards': Array<string>;
}

