/******************************************************************************
 *
 * File:    http-client.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Provides typed HTTP and JSON request handling.
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
export class HttpError extends Error {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   message              Value supplied for message.
     * @param   options              Error status, response body, and cause.
     */
    /******************************************************************************/
    constructor(message, {status = 0, body = null, cause} = {}) {
        super(message, {cause});
        this.name = "HttpError";
        this.status = status;
        this.body = body;
    }
}

/** Transport only: this class deliberately has no UI dependencies. */
export class HttpClient {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   options              Value supplied for options.
     */
    /******************************************************************************/
    constructor({baseUrl = "", fetchImpl = globalThis.fetch, onUnauthorized = null} = {}) {
        if (typeof fetchImpl !== "function") throw new TypeError("fetch is unavailable.");

        this.baseUrl = baseUrl;
        this.fetch = fetchImpl === globalThis.fetch
            ? fetchImpl.bind(globalThis)
            : fetchImpl;
        this.onUnauthorized = onUnauthorized;
    }

    /******************************************************************************/
    /*!
     * @brief   Retrieves the requested value or resource.
     * @param   path                 Value supplied for path.
     * @param   query                Value supplied for query.
     * @param   options              Value supplied for options.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    get(path, query, options) {
        return this.request(path, {...options, method: "GET", query});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the post operation.
     * @param   path                 Value supplied for path.
     * @param   body                 Value supplied for body.
     * @param   options              Value supplied for options.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    post(path, body, options) {
        return this.request(path, {...options, method: "POST", body});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the put operation.
     * @param   path                 Value supplied for path.
     * @param   body                 Value supplied for body.
     * @param   options              Value supplied for options.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    put(path, body, options) {
        return this.request(path, {...options, method: "PUT", body});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the delete operation.
     * @param   path                 Value supplied for path.
     * @param   body                 Value supplied for body.
     * @param   options              Value supplied for options.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    delete(path, body, options) {
        return this.request(path, {...options, method: "DELETE", body});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs an HTTP request and parses its response.
     * @param   path                 Value supplied for path.
     * @param   options              HTTP request options.
     * @returns Promise              Parsed response body.
     */
    /******************************************************************************/
    async request(path, {
        method = "GET",
        query,
        body,
        headers = {},
        signal,
        formEncoded = false
    } = {}) {
        const url = new URL(path, this.baseUrl || globalThis.location?.origin || "http://localhost");

        for (const [key, value] of Object.entries(query ?? {})) {
            if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
        }

        const requestHeaders = {...headers};
        let requestBody;

        if (body !== undefined) {
            if (formEncoded) {
                requestHeaders["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
                requestBody = new URLSearchParams(body).toString();
            } else {
                requestHeaders["Content-Type"] = "application/json; charset=utf-8";
                requestBody = JSON.stringify(body);
            }
        }

        let response;

        try {
            response = await this.fetch(url, {
                method,
                headers: requestHeaders,
                body: requestBody,
                signal
            });
        } catch (cause) {
            if (cause?.name === "AbortError") throw cause;

            throw new HttpError(cause?.message || "Network request failed.", {cause});
        }

        const responseBody = await parseResponse(response);

        if (response.status === 401) await this.onUnauthorized?.(responseBody);
        if (!response.ok) {
            throw new HttpError(
                responseBody?.message || response.statusText || "Request failed.",
                {status: response.status, body: responseBody}
            );
        }

        return responseBody;
    }
}

/******************************************************************************/
/*!
 * @brief   Parses an HTTP response according to its status and content type.
 * @param   response             Value supplied for response.
 * @returns Promise              Result produced by the operation.
 */
/******************************************************************************/
async function parseResponse(response) {
    if (response.status === 204) return null;

    const contentType = response.headers?.get?.("content-type") ?? "";

    if (contentType.includes("application/json")) return response.json();

    const text = await response.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
