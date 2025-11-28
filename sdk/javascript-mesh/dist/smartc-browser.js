var SmaRTC = (function (exports) {
    'use strict';

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Error thrown when an HTTP request fails. */
    class HttpError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.HttpError}.
         *
         * @param {string} errorMessage A descriptive error message.
         * @param {number} statusCode The HTTP status code represented by this error.
         */
        constructor(errorMessage, statusCode) {
            const trueProto = new.target.prototype;
            super(`${errorMessage}: Status code '${statusCode}'`);
            this.statusCode = statusCode;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when a timeout elapses. */
    class TimeoutError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.TimeoutError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        constructor(errorMessage = "A timeout occurred.") {
            const trueProto = new.target.prototype;
            super(errorMessage);
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when an action is aborted. */
    class AbortError extends Error {
        /** Constructs a new instance of {@link AbortError}.
         *
         * @param {string} errorMessage A descriptive error message.
         */
        constructor(errorMessage = "An abort occurred.") {
            const trueProto = new.target.prototype;
            super(errorMessage);
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport is unsupported by the browser. */
    /** @private */
    class UnsupportedTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.UnsupportedTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'UnsupportedTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport is disabled by the browser. */
    /** @private */
    class DisabledTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.DisabledTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'DisabledTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the selected transport cannot be started. */
    /** @private */
    class FailedToStartTransportError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.FailedToStartTransportError}.
         *
         * @param {string} message A descriptive error message.
         * @param {HttpTransportType} transport The {@link @microsoft/signalr.HttpTransportType} this error occurred on.
         */
        constructor(message, transport) {
            const trueProto = new.target.prototype;
            super(message);
            this.transport = transport;
            this.errorType = 'FailedToStartTransportError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when the negotiation with the server failed to complete. */
    /** @private */
    class FailedToNegotiateWithServerError extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.FailedToNegotiateWithServerError}.
         *
         * @param {string} message A descriptive error message.
         */
        constructor(message) {
            const trueProto = new.target.prototype;
            super(message);
            this.errorType = 'FailedToNegotiateWithServerError';
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }
    /** Error thrown when multiple errors have occurred. */
    /** @private */
    class AggregateErrors extends Error {
        /** Constructs a new instance of {@link @microsoft/signalr.AggregateErrors}.
         *
         * @param {string} message A descriptive error message.
         * @param {Error[]} innerErrors The collection of errors this error is aggregating.
         */
        constructor(message, innerErrors) {
            const trueProto = new.target.prototype;
            super(message);
            this.innerErrors = innerErrors;
            // Workaround issue in Typescript compiler
            // https://github.com/Microsoft/TypeScript/issues/13965#issuecomment-278570200
            this.__proto__ = trueProto;
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Represents an HTTP response. */
    class HttpResponse {
        constructor(statusCode, statusText, content) {
            this.statusCode = statusCode;
            this.statusText = statusText;
            this.content = content;
        }
    }
    /** Abstraction over an HTTP client.
     *
     * This class provides an abstraction over an HTTP client so that a different implementation can be provided on different platforms.
     */
    class HttpClient {
        get(url, options) {
            return this.send({
                ...options,
                method: "GET",
                url,
            });
        }
        post(url, options) {
            return this.send({
                ...options,
                method: "POST",
                url,
            });
        }
        delete(url, options) {
            return this.send({
                ...options,
                method: "DELETE",
                url,
            });
        }
        /** Gets all cookies that apply to the specified URL.
         *
         * @param url The URL that the cookies are valid for.
         * @returns {string} A string containing all the key-value cookie pairs for the specified URL.
         */
        // @ts-ignore
        getCookieString(url) {
            return "";
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // These values are designed to match the ASP.NET Log Levels since that's the pattern we're emulating here.
    /** Indicates the severity of a log message.
     *
     * Log Levels are ordered in increasing severity. So `Debug` is more severe than `Trace`, etc.
     */
    var LogLevel;
    (function (LogLevel) {
        /** Log level for very low severity diagnostic messages. */
        LogLevel[LogLevel["Trace"] = 0] = "Trace";
        /** Log level for low severity diagnostic messages. */
        LogLevel[LogLevel["Debug"] = 1] = "Debug";
        /** Log level for informational diagnostic messages. */
        LogLevel[LogLevel["Information"] = 2] = "Information";
        /** Log level for diagnostic messages that indicate a non-fatal problem. */
        LogLevel[LogLevel["Warning"] = 3] = "Warning";
        /** Log level for diagnostic messages that indicate a failure in the current operation. */
        LogLevel[LogLevel["Error"] = 4] = "Error";
        /** Log level for diagnostic messages that indicate a failure that will terminate the entire application. */
        LogLevel[LogLevel["Critical"] = 5] = "Critical";
        /** The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted. */
        LogLevel[LogLevel["None"] = 6] = "None";
    })(LogLevel || (LogLevel = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** A logger that does nothing when log messages are sent to it. */
    class NullLogger {
        constructor() { }
        /** @inheritDoc */
        // eslint-disable-next-line
        log(_logLevel, _message) {
        }
    }
    /** The singleton instance of the {@link @microsoft/signalr.NullLogger}. */
    NullLogger.instance = new NullLogger();

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Version token that will be replaced by the prepack command
    /** The version of the SignalR client. */
    const VERSION = "8.0.17";
    /** @private */
    class Arg {
        static isRequired(val, name) {
            if (val === null || val === undefined) {
                throw new Error(`The '${name}' argument is required.`);
            }
        }
        static isNotEmpty(val, name) {
            if (!val || val.match(/^\s*$/)) {
                throw new Error(`The '${name}' argument should not be empty.`);
            }
        }
        static isIn(val, values, name) {
            // TypeScript enums have keys for **both** the name and the value of each enum member on the type itself.
            if (!(val in values)) {
                throw new Error(`Unknown ${name} value: ${val}.`);
            }
        }
    }
    /** @private */
    class Platform {
        // react-native has a window but no document so we should check both
        static get isBrowser() {
            return !Platform.isNode && typeof window === "object" && typeof window.document === "object";
        }
        // WebWorkers don't have a window object so the isBrowser check would fail
        static get isWebWorker() {
            return !Platform.isNode && typeof self === "object" && "importScripts" in self;
        }
        // react-native has a window but no document
        static get isReactNative() {
            return !Platform.isNode && typeof window === "object" && typeof window.document === "undefined";
        }
        // Node apps shouldn't have a window object, but WebWorkers don't either
        // so we need to check for both WebWorker and window
        static get isNode() {
            return typeof process !== "undefined" && process.release && process.release.name === "node";
        }
    }
    /** @private */
    function getDataDetail(data, includeContent) {
        let detail = "";
        if (isArrayBuffer(data)) {
            detail = `Binary data of length ${data.byteLength}`;
            if (includeContent) {
                detail += `. Content: '${formatArrayBuffer(data)}'`;
            }
        }
        else if (typeof data === "string") {
            detail = `String data of length ${data.length}`;
            if (includeContent) {
                detail += `. Content: '${data}'`;
            }
        }
        return detail;
    }
    /** @private */
    function formatArrayBuffer(data) {
        const view = new Uint8Array(data);
        // Uint8Array.map only supports returning another Uint8Array?
        let str = "";
        view.forEach((num) => {
            const pad = num < 16 ? "0" : "";
            str += `0x${pad}${num.toString(16)} `;
        });
        // Trim of trailing space.
        return str.substr(0, str.length - 1);
    }
    // Also in signalr-protocol-msgpack/Utils.ts
    /** @private */
    function isArrayBuffer(val) {
        return val && typeof ArrayBuffer !== "undefined" &&
            (val instanceof ArrayBuffer ||
                // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
                (val.constructor && val.constructor.name === "ArrayBuffer"));
    }
    /** @private */
    async function sendMessage(logger, transportName, httpClient, url, content, options) {
        const headers = {};
        const [name, value] = getUserAgentHeader();
        headers[name] = value;
        logger.log(LogLevel.Trace, `(${transportName} transport) sending data. ${getDataDetail(content, options.logMessageContent)}.`);
        const responseType = isArrayBuffer(content) ? "arraybuffer" : "text";
        const response = await httpClient.post(url, {
            content,
            headers: { ...headers, ...options.headers },
            responseType,
            timeout: options.timeout,
            withCredentials: options.withCredentials,
        });
        logger.log(LogLevel.Trace, `(${transportName} transport) request complete. Response status: ${response.statusCode}.`);
    }
    /** @private */
    function createLogger(logger) {
        if (logger === undefined) {
            return new ConsoleLogger(LogLevel.Information);
        }
        if (logger === null) {
            return NullLogger.instance;
        }
        if (logger.log !== undefined) {
            return logger;
        }
        return new ConsoleLogger(logger);
    }
    /** @private */
    class SubjectSubscription {
        constructor(subject, observer) {
            this._subject = subject;
            this._observer = observer;
        }
        dispose() {
            const index = this._subject.observers.indexOf(this._observer);
            if (index > -1) {
                this._subject.observers.splice(index, 1);
            }
            if (this._subject.observers.length === 0 && this._subject.cancelCallback) {
                this._subject.cancelCallback().catch((_) => { });
            }
        }
    }
    /** @private */
    class ConsoleLogger {
        constructor(minimumLogLevel) {
            this._minLevel = minimumLogLevel;
            this.out = console;
        }
        log(logLevel, message) {
            if (logLevel >= this._minLevel) {
                const msg = `[${new Date().toISOString()}] ${LogLevel[logLevel]}: ${message}`;
                switch (logLevel) {
                    case LogLevel.Critical:
                    case LogLevel.Error:
                        this.out.error(msg);
                        break;
                    case LogLevel.Warning:
                        this.out.warn(msg);
                        break;
                    case LogLevel.Information:
                        this.out.info(msg);
                        break;
                    default:
                        // console.debug only goes to attached debuggers in Node, so we use console.log for Trace and Debug
                        this.out.log(msg);
                        break;
                }
            }
        }
    }
    /** @private */
    function getUserAgentHeader() {
        let userAgentHeaderName = "X-SignalR-User-Agent";
        if (Platform.isNode) {
            userAgentHeaderName = "User-Agent";
        }
        return [userAgentHeaderName, constructUserAgent(VERSION, getOsName(), getRuntime(), getRuntimeVersion())];
    }
    /** @private */
    function constructUserAgent(version, os, runtime, runtimeVersion) {
        // Microsoft SignalR/[Version] ([Detailed Version]; [Operating System]; [Runtime]; [Runtime Version])
        let userAgent = "Microsoft SignalR/";
        const majorAndMinor = version.split(".");
        userAgent += `${majorAndMinor[0]}.${majorAndMinor[1]}`;
        userAgent += ` (${version}; `;
        if (os && os !== "") {
            userAgent += `${os}; `;
        }
        else {
            userAgent += "Unknown OS; ";
        }
        userAgent += `${runtime}`;
        if (runtimeVersion) {
            userAgent += `; ${runtimeVersion}`;
        }
        else {
            userAgent += "; Unknown Runtime Version";
        }
        userAgent += ")";
        return userAgent;
    }
    // eslint-disable-next-line spaced-comment
     function getOsName() {
        if (Platform.isNode) {
            switch (process.platform) {
                case "win32":
                    return "Windows NT";
                case "darwin":
                    return "macOS";
                case "linux":
                    return "Linux";
                default:
                    return process.platform;
            }
        }
        else {
            return "";
        }
    }
    // eslint-disable-next-line spaced-comment
     function getRuntimeVersion() {
        if (Platform.isNode) {
            return process.versions.node;
        }
        return undefined;
    }
    function getRuntime() {
        if (Platform.isNode) {
            return "NodeJS";
        }
        else {
            return "Browser";
        }
    }
    /** @private */
    function getErrorString(e) {
        if (e.stack) {
            return e.stack;
        }
        else if (e.message) {
            return e.message;
        }
        return `${e}`;
    }
    /** @private */
    function getGlobalThis() {
        // globalThis is semi-new and not available in Node until v12
        if (typeof globalThis !== "undefined") {
            return globalThis;
        }
        if (typeof self !== "undefined") {
            return self;
        }
        if (typeof window !== "undefined") {
            return window;
        }
        if (typeof global !== "undefined") {
            return global;
        }
        throw new Error("could not find global");
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    class FetchHttpClient extends HttpClient {
        constructor(logger) {
            super();
            this._logger = logger;
            // Node added a fetch implementation to the global scope starting in v18.
            // We need to add a cookie jar in node to be able to share cookies with WebSocket
            if (typeof fetch === "undefined" || Platform.isNode) {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                // Cookies aren't automatically handled in Node so we need to add a CookieJar to preserve cookies across requests
                this._jar = new (requireFunc("tough-cookie")).CookieJar();
                if (typeof fetch === "undefined") {
                    this._fetchType = requireFunc("node-fetch");
                }
                else {
                    // Use fetch from Node if available
                    this._fetchType = fetch;
                }
                // node-fetch doesn't have a nice API for getting and setting cookies
                // fetch-cookie will wrap a fetch implementation with a default CookieJar or a provided one
                this._fetchType = requireFunc("fetch-cookie")(this._fetchType, this._jar);
            }
            else {
                this._fetchType = fetch.bind(getGlobalThis());
            }
            if (typeof AbortController === "undefined") {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                // Node needs EventListener methods on AbortController which our custom polyfill doesn't provide
                this._abortControllerType = requireFunc("abort-controller");
            }
            else {
                this._abortControllerType = AbortController;
            }
        }
        /** @inheritDoc */
        async send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                throw new AbortError();
            }
            if (!request.method) {
                throw new Error("No method defined.");
            }
            if (!request.url) {
                throw new Error("No url defined.");
            }
            const abortController = new this._abortControllerType();
            let error;
            // Hook our abortSignal into the abort controller
            if (request.abortSignal) {
                request.abortSignal.onabort = () => {
                    abortController.abort();
                    error = new AbortError();
                };
            }
            // If a timeout has been passed in, setup a timeout to call abort
            // Type needs to be any to fit window.setTimeout and NodeJS.setTimeout
            let timeoutId = null;
            if (request.timeout) {
                const msTimeout = request.timeout;
                timeoutId = setTimeout(() => {
                    abortController.abort();
                    this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                    error = new TimeoutError();
                }, msTimeout);
            }
            if (request.content === "") {
                request.content = undefined;
            }
            if (request.content) {
                // Explicitly setting the Content-Type header for React Native on Android platform.
                request.headers = request.headers || {};
                if (isArrayBuffer(request.content)) {
                    request.headers["Content-Type"] = "application/octet-stream";
                }
                else {
                    request.headers["Content-Type"] = "text/plain;charset=UTF-8";
                }
            }
            let response;
            try {
                response = await this._fetchType(request.url, {
                    body: request.content,
                    cache: "no-cache",
                    credentials: request.withCredentials === true ? "include" : "same-origin",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        ...request.headers,
                    },
                    method: request.method,
                    mode: "cors",
                    redirect: "follow",
                    signal: abortController.signal,
                });
            }
            catch (e) {
                if (error) {
                    throw error;
                }
                this._logger.log(LogLevel.Warning, `Error from HTTP request. ${e}.`);
                throw e;
            }
            finally {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (request.abortSignal) {
                    request.abortSignal.onabort = null;
                }
            }
            if (!response.ok) {
                const errorMessage = await deserializeContent(response, "text");
                throw new HttpError(errorMessage || response.statusText, response.status);
            }
            const content = deserializeContent(response, request.responseType);
            const payload = await content;
            return new HttpResponse(response.status, response.statusText, payload);
        }
        getCookieString(url) {
            let cookies = "";
            if (Platform.isNode && this._jar) {
                // @ts-ignore: unused variable
                this._jar.getCookies(url, (e, c) => cookies = c.join("; "));
            }
            return cookies;
        }
    }
    function deserializeContent(response, responseType) {
        let content;
        switch (responseType) {
            case "arraybuffer":
                content = response.arrayBuffer();
                break;
            case "text":
                content = response.text();
                break;
            case "blob":
            case "document":
            case "json":
                throw new Error(`${responseType} is not supported.`);
            default:
                content = response.text();
                break;
        }
        return content;
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    class XhrHttpClient extends HttpClient {
        constructor(logger) {
            super();
            this._logger = logger;
        }
        /** @inheritDoc */
        send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(request.method, request.url, true);
                xhr.withCredentials = request.withCredentials === undefined ? true : request.withCredentials;
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                if (request.content === "") {
                    request.content = undefined;
                }
                if (request.content) {
                    // Explicitly setting the Content-Type header for React Native on Android platform.
                    if (isArrayBuffer(request.content)) {
                        xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    }
                    else {
                        xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
                    }
                }
                const headers = request.headers;
                if (headers) {
                    Object.keys(headers)
                        .forEach((header) => {
                        xhr.setRequestHeader(header, headers[header]);
                    });
                }
                if (request.responseType) {
                    xhr.responseType = request.responseType;
                }
                if (request.abortSignal) {
                    request.abortSignal.onabort = () => {
                        xhr.abort();
                        reject(new AbortError());
                    };
                }
                if (request.timeout) {
                    xhr.timeout = request.timeout;
                }
                xhr.onload = () => {
                    if (request.abortSignal) {
                        request.abortSignal.onabort = null;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(new HttpResponse(xhr.status, xhr.statusText, xhr.response || xhr.responseText));
                    }
                    else {
                        reject(new HttpError(xhr.response || xhr.responseText || xhr.statusText, xhr.status));
                    }
                };
                xhr.onerror = () => {
                    this._logger.log(LogLevel.Warning, `Error from HTTP request. ${xhr.status}: ${xhr.statusText}.`);
                    reject(new HttpError(xhr.statusText, xhr.status));
                };
                xhr.ontimeout = () => {
                    this._logger.log(LogLevel.Warning, `Timeout from HTTP request.`);
                    reject(new TimeoutError());
                };
                xhr.send(request.content);
            });
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Default implementation of {@link @microsoft/signalr.HttpClient}. */
    class DefaultHttpClient extends HttpClient {
        /** Creates a new instance of the {@link @microsoft/signalr.DefaultHttpClient}, using the provided {@link @microsoft/signalr.ILogger} to log messages. */
        constructor(logger) {
            super();
            if (typeof fetch !== "undefined" || Platform.isNode) {
                this._httpClient = new FetchHttpClient(logger);
            }
            else if (typeof XMLHttpRequest !== "undefined") {
                this._httpClient = new XhrHttpClient(logger);
            }
            else {
                throw new Error("No usable HttpClient found.");
            }
        }
        /** @inheritDoc */
        send(request) {
            // Check that abort was not signaled before calling send
            if (request.abortSignal && request.abortSignal.aborted) {
                return Promise.reject(new AbortError());
            }
            if (!request.method) {
                return Promise.reject(new Error("No method defined."));
            }
            if (!request.url) {
                return Promise.reject(new Error("No url defined."));
            }
            return this._httpClient.send(request);
        }
        getCookieString(url) {
            return this._httpClient.getCookieString(url);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Not exported from index
    /** @private */
    class TextMessageFormat {
        static write(output) {
            return `${output}${TextMessageFormat.RecordSeparator}`;
        }
        static parse(input) {
            if (input[input.length - 1] !== TextMessageFormat.RecordSeparator) {
                throw new Error("Message is incomplete.");
            }
            const messages = input.split(TextMessageFormat.RecordSeparator);
            messages.pop();
            return messages;
        }
    }
    TextMessageFormat.RecordSeparatorCode = 0x1e;
    TextMessageFormat.RecordSeparator = String.fromCharCode(TextMessageFormat.RecordSeparatorCode);

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** @private */
    class HandshakeProtocol {
        // Handshake request is always JSON
        writeHandshakeRequest(handshakeRequest) {
            return TextMessageFormat.write(JSON.stringify(handshakeRequest));
        }
        parseHandshakeResponse(data) {
            let messageData;
            let remainingData;
            if (isArrayBuffer(data)) {
                // Format is binary but still need to read JSON text from handshake response
                const binaryData = new Uint8Array(data);
                const separatorIndex = binaryData.indexOf(TextMessageFormat.RecordSeparatorCode);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                const responseLength = separatorIndex + 1;
                messageData = String.fromCharCode.apply(null, Array.prototype.slice.call(binaryData.slice(0, responseLength)));
                remainingData = (binaryData.byteLength > responseLength) ? binaryData.slice(responseLength).buffer : null;
            }
            else {
                const textData = data;
                const separatorIndex = textData.indexOf(TextMessageFormat.RecordSeparator);
                if (separatorIndex === -1) {
                    throw new Error("Message is incomplete.");
                }
                // content before separator is handshake response
                // optional content after is additional messages
                const responseLength = separatorIndex + 1;
                messageData = textData.substring(0, responseLength);
                remainingData = (textData.length > responseLength) ? textData.substring(responseLength) : null;
            }
            // At this point we should have just the single handshake message
            const messages = TextMessageFormat.parse(messageData);
            const response = JSON.parse(messages[0]);
            if (response.type) {
                throw new Error("Expected a handshake response from the server.");
            }
            const responseMessage = response;
            // multiple messages could have arrived with handshake
            // return additional data to be parsed as usual, or null if all parsed
            return [remainingData, responseMessage];
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Defines the type of a Hub Message. */
    var MessageType;
    (function (MessageType) {
        /** Indicates the message is an Invocation message and implements the {@link @microsoft/signalr.InvocationMessage} interface. */
        MessageType[MessageType["Invocation"] = 1] = "Invocation";
        /** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
        MessageType[MessageType["StreamItem"] = 2] = "StreamItem";
        /** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
        MessageType[MessageType["Completion"] = 3] = "Completion";
        /** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
        MessageType[MessageType["StreamInvocation"] = 4] = "StreamInvocation";
        /** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
        MessageType[MessageType["CancelInvocation"] = 5] = "CancelInvocation";
        /** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
        MessageType[MessageType["Ping"] = 6] = "Ping";
        /** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
        MessageType[MessageType["Close"] = 7] = "Close";
        MessageType[MessageType["Ack"] = 8] = "Ack";
        MessageType[MessageType["Sequence"] = 9] = "Sequence";
    })(MessageType || (MessageType = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** Stream implementation to stream items to the server. */
    class Subject {
        constructor() {
            this.observers = [];
        }
        next(item) {
            for (const observer of this.observers) {
                observer.next(item);
            }
        }
        error(err) {
            for (const observer of this.observers) {
                if (observer.error) {
                    observer.error(err);
                }
            }
        }
        complete() {
            for (const observer of this.observers) {
                if (observer.complete) {
                    observer.complete();
                }
            }
        }
        subscribe(observer) {
            this.observers.push(observer);
            return new SubjectSubscription(this, observer);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** @private */
    class MessageBuffer {
        constructor(protocol, connection, bufferSize) {
            this._bufferSize = 100000;
            this._messages = [];
            this._totalMessageCount = 0;
            this._waitForSequenceMessage = false;
            // Message IDs start at 1 and always increment by 1
            this._nextReceivingSequenceId = 1;
            this._latestReceivedSequenceId = 0;
            this._bufferedByteCount = 0;
            this._reconnectInProgress = false;
            this._protocol = protocol;
            this._connection = connection;
            this._bufferSize = bufferSize;
        }
        async _send(message) {
            const serializedMessage = this._protocol.writeMessage(message);
            let backpressurePromise = Promise.resolve();
            // Only count invocation messages. Acks, pings, etc. don't need to be resent on reconnect
            if (this._isInvocationMessage(message)) {
                this._totalMessageCount++;
                let backpressurePromiseResolver = () => { };
                let backpressurePromiseRejector = () => { };
                if (isArrayBuffer(serializedMessage)) {
                    this._bufferedByteCount += serializedMessage.byteLength;
                }
                else {
                    this._bufferedByteCount += serializedMessage.length;
                }
                if (this._bufferedByteCount >= this._bufferSize) {
                    backpressurePromise = new Promise((resolve, reject) => {
                        backpressurePromiseResolver = resolve;
                        backpressurePromiseRejector = reject;
                    });
                }
                this._messages.push(new BufferedItem(serializedMessage, this._totalMessageCount, backpressurePromiseResolver, backpressurePromiseRejector));
            }
            try {
                // If this is set it means we are reconnecting or resending
                // We don't want to send on a disconnected connection
                // And we don't want to send if resend is running since that would mean sending
                // this message twice
                if (!this._reconnectInProgress) {
                    await this._connection.send(serializedMessage);
                }
            }
            catch {
                this._disconnected();
            }
            await backpressurePromise;
        }
        _ack(ackMessage) {
            let newestAckedMessage = -1;
            // Find index of newest message being acked
            for (let index = 0; index < this._messages.length; index++) {
                const element = this._messages[index];
                if (element._id <= ackMessage.sequenceId) {
                    newestAckedMessage = index;
                    if (isArrayBuffer(element._message)) {
                        this._bufferedByteCount -= element._message.byteLength;
                    }
                    else {
                        this._bufferedByteCount -= element._message.length;
                    }
                    // resolve items that have already been sent and acked
                    element._resolver();
                }
                else if (this._bufferedByteCount < this._bufferSize) {
                    // resolve items that now fall under the buffer limit but haven't been acked
                    element._resolver();
                }
                else {
                    break;
                }
            }
            if (newestAckedMessage !== -1) {
                // We're removing everything including the message pointed to, so add 1
                this._messages = this._messages.slice(newestAckedMessage + 1);
            }
        }
        _shouldProcessMessage(message) {
            if (this._waitForSequenceMessage) {
                if (message.type !== MessageType.Sequence) {
                    return false;
                }
                else {
                    this._waitForSequenceMessage = false;
                    return true;
                }
            }
            // No special processing for acks, pings, etc.
            if (!this._isInvocationMessage(message)) {
                return true;
            }
            const currentId = this._nextReceivingSequenceId;
            this._nextReceivingSequenceId++;
            if (currentId <= this._latestReceivedSequenceId) {
                if (currentId === this._latestReceivedSequenceId) {
                    // Should only hit this if we just reconnected and the server is sending
                    // Messages it has buffered, which would mean it hasn't seen an Ack for these messages
                    this._ackTimer();
                }
                // Ignore, this is a duplicate message
                return false;
            }
            this._latestReceivedSequenceId = currentId;
            // Only start the timer for sending an Ack message when we have a message to ack. This also conveniently solves
            // timer throttling by not having a recursive timer, and by starting the timer via a network call (recv)
            this._ackTimer();
            return true;
        }
        _resetSequence(message) {
            if (message.sequenceId > this._nextReceivingSequenceId) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this._connection.stop(new Error("Sequence ID greater than amount of messages we've received."));
                return;
            }
            this._nextReceivingSequenceId = message.sequenceId;
        }
        _disconnected() {
            this._reconnectInProgress = true;
            this._waitForSequenceMessage = true;
        }
        async _resend() {
            const sequenceId = this._messages.length !== 0
                ? this._messages[0]._id
                : this._totalMessageCount + 1;
            await this._connection.send(this._protocol.writeMessage({ type: MessageType.Sequence, sequenceId }));
            // Get a local variable to the _messages, just in case messages are acked while resending
            // Which would slice the _messages array (which creates a new copy)
            const messages = this._messages;
            for (const element of messages) {
                await this._connection.send(element._message);
            }
            this._reconnectInProgress = false;
        }
        _dispose(error) {
            error !== null && error !== void 0 ? error : (error = new Error("Unable to reconnect to server."));
            // Unblock backpressure if any
            for (const element of this._messages) {
                element._rejector(error);
            }
        }
        _isInvocationMessage(message) {
            // There is no way to check if something implements an interface.
            // So we individually check the messages in a switch statement.
            // To make sure we don't miss any message types we rely on the compiler
            // seeing the function returns a value and it will do the
            // exhaustive check for us on the switch statement, since we don't use 'case default'
            switch (message.type) {
                case MessageType.Invocation:
                case MessageType.StreamItem:
                case MessageType.Completion:
                case MessageType.StreamInvocation:
                case MessageType.CancelInvocation:
                    return true;
                case MessageType.Close:
                case MessageType.Sequence:
                case MessageType.Ping:
                case MessageType.Ack:
                    return false;
            }
        }
        _ackTimer() {
            if (this._ackTimerHandle === undefined) {
                this._ackTimerHandle = setTimeout(async () => {
                    try {
                        if (!this._reconnectInProgress) {
                            await this._connection.send(this._protocol.writeMessage({ type: MessageType.Ack, sequenceId: this._latestReceivedSequenceId }));
                        }
                        // Ignore errors, that means the connection is closed and we don't care about the Ack message anymore.
                    }
                    catch { }
                    clearTimeout(this._ackTimerHandle);
                    this._ackTimerHandle = undefined;
                    // 1 second delay so we don't spam Ack messages if there are many messages being received at once.
                }, 1000);
            }
        }
    }
    class BufferedItem {
        constructor(message, id, resolver, rejector) {
            this._message = message;
            this._id = id;
            this._resolver = resolver;
            this._rejector = rejector;
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    const DEFAULT_TIMEOUT_IN_MS = 30 * 1000;
    const DEFAULT_PING_INTERVAL_IN_MS = 15 * 1000;
    const DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE = 100000;
    /** Describes the current state of the {@link HubConnection} to the server. */
    var HubConnectionState;
    (function (HubConnectionState) {
        /** The hub connection is disconnected. */
        HubConnectionState["Disconnected"] = "Disconnected";
        /** The hub connection is connecting. */
        HubConnectionState["Connecting"] = "Connecting";
        /** The hub connection is connected. */
        HubConnectionState["Connected"] = "Connected";
        /** The hub connection is disconnecting. */
        HubConnectionState["Disconnecting"] = "Disconnecting";
        /** The hub connection is reconnecting. */
        HubConnectionState["Reconnecting"] = "Reconnecting";
    })(HubConnectionState || (HubConnectionState = {}));
    /** Represents a connection to a SignalR Hub. */
    class HubConnection {
        /** @internal */
        // Using a public static factory method means we can have a private constructor and an _internal_
        // create method that can be used by HubConnectionBuilder. An "internal" constructor would just
        // be stripped away and the '.d.ts' file would have no constructor, which is interpreted as a
        // public parameter-less constructor.
        static create(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
            return new HubConnection(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize);
        }
        constructor(connection, logger, protocol, reconnectPolicy, serverTimeoutInMilliseconds, keepAliveIntervalInMilliseconds, statefulReconnectBufferSize) {
            this._nextKeepAlive = 0;
            this._freezeEventListener = () => {
                this._logger.log(LogLevel.Warning, "The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep");
            };
            Arg.isRequired(connection, "connection");
            Arg.isRequired(logger, "logger");
            Arg.isRequired(protocol, "protocol");
            this.serverTimeoutInMilliseconds = serverTimeoutInMilliseconds !== null && serverTimeoutInMilliseconds !== void 0 ? serverTimeoutInMilliseconds : DEFAULT_TIMEOUT_IN_MS;
            this.keepAliveIntervalInMilliseconds = keepAliveIntervalInMilliseconds !== null && keepAliveIntervalInMilliseconds !== void 0 ? keepAliveIntervalInMilliseconds : DEFAULT_PING_INTERVAL_IN_MS;
            this._statefulReconnectBufferSize = statefulReconnectBufferSize !== null && statefulReconnectBufferSize !== void 0 ? statefulReconnectBufferSize : DEFAULT_STATEFUL_RECONNECT_BUFFER_SIZE;
            this._logger = logger;
            this._protocol = protocol;
            this.connection = connection;
            this._reconnectPolicy = reconnectPolicy;
            this._handshakeProtocol = new HandshakeProtocol();
            this.connection.onreceive = (data) => this._processIncomingData(data);
            this.connection.onclose = (error) => this._connectionClosed(error);
            this._callbacks = {};
            this._methods = {};
            this._closedCallbacks = [];
            this._reconnectingCallbacks = [];
            this._reconnectedCallbacks = [];
            this._invocationId = 0;
            this._receivedHandshakeResponse = false;
            this._connectionState = HubConnectionState.Disconnected;
            this._connectionStarted = false;
            this._cachedPingMessage = this._protocol.writeMessage({ type: MessageType.Ping });
        }
        /** Indicates the state of the {@link HubConnection} to the server. */
        get state() {
            return this._connectionState;
        }
        /** Represents the connection id of the {@link HubConnection} on the server. The connection id will be null when the connection is either
         *  in the disconnected state or if the negotiation step was skipped.
         */
        get connectionId() {
            return this.connection ? (this.connection.connectionId || null) : null;
        }
        /** Indicates the url of the {@link HubConnection} to the server. */
        get baseUrl() {
            return this.connection.baseUrl || "";
        }
        /**
         * Sets a new url for the HubConnection. Note that the url can only be changed when the connection is in either the Disconnected or
         * Reconnecting states.
         * @param {string} url The url to connect to.
         */
        set baseUrl(url) {
            if (this._connectionState !== HubConnectionState.Disconnected && this._connectionState !== HubConnectionState.Reconnecting) {
                throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");
            }
            if (!url) {
                throw new Error("The HubConnection url must be a valid url.");
            }
            this.connection.baseUrl = url;
        }
        /** Starts the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully established, or rejects with an error.
         */
        start() {
            this._startPromise = this._startWithStateTransitions();
            return this._startPromise;
        }
        async _startWithStateTransitions() {
            if (this._connectionState !== HubConnectionState.Disconnected) {
                return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
            }
            this._connectionState = HubConnectionState.Connecting;
            this._logger.log(LogLevel.Debug, "Starting HubConnection.");
            try {
                await this._startInternal();
                if (Platform.isBrowser) {
                    // Log when the browser freezes the tab so users know why their connection unexpectedly stopped working
                    window.document.addEventListener("freeze", this._freezeEventListener);
                }
                this._connectionState = HubConnectionState.Connected;
                this._connectionStarted = true;
                this._logger.log(LogLevel.Debug, "HubConnection connected successfully.");
            }
            catch (e) {
                this._connectionState = HubConnectionState.Disconnected;
                this._logger.log(LogLevel.Debug, `HubConnection failed to start successfully because of error '${e}'.`);
                return Promise.reject(e);
            }
        }
        async _startInternal() {
            this._stopDuringStartError = undefined;
            this._receivedHandshakeResponse = false;
            // Set up the promise before any connection is (re)started otherwise it could race with received messages
            const handshakePromise = new Promise((resolve, reject) => {
                this._handshakeResolver = resolve;
                this._handshakeRejecter = reject;
            });
            await this.connection.start(this._protocol.transferFormat);
            try {
                let version = this._protocol.version;
                if (!this.connection.features.reconnect) {
                    // Stateful Reconnect starts with HubProtocol version 2, newer clients connecting to older servers will fail to connect due to
                    // the handshake only supporting version 1, so we will try to send version 1 during the handshake to keep old servers working.
                    version = 1;
                }
                const handshakeRequest = {
                    protocol: this._protocol.name,
                    version,
                };
                this._logger.log(LogLevel.Debug, "Sending handshake request.");
                await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(handshakeRequest));
                this._logger.log(LogLevel.Information, `Using HubProtocol '${this._protocol.name}'.`);
                // defensively cleanup timeout in case we receive a message from the server before we finish start
                this._cleanupTimeout();
                this._resetTimeoutPeriod();
                this._resetKeepAliveInterval();
                await handshakePromise;
                // It's important to check the stopDuringStartError instead of just relying on the handshakePromise
                // being rejected on close, because this continuation can run after both the handshake completed successfully
                // and the connection was closed.
                if (this._stopDuringStartError) {
                    // It's important to throw instead of returning a rejected promise, because we don't want to allow any state
                    // transitions to occur between now and the calling code observing the exceptions. Returning a rejected promise
                    // will cause the calling continuation to get scheduled to run later.
                    // eslint-disable-next-line @typescript-eslint/no-throw-literal
                    throw this._stopDuringStartError;
                }
                const useStatefulReconnect = this.connection.features.reconnect || false;
                if (useStatefulReconnect) {
                    this._messageBuffer = new MessageBuffer(this._protocol, this.connection, this._statefulReconnectBufferSize);
                    this.connection.features.disconnected = this._messageBuffer._disconnected.bind(this._messageBuffer);
                    this.connection.features.resend = () => {
                        if (this._messageBuffer) {
                            return this._messageBuffer._resend();
                        }
                    };
                }
                if (!this.connection.features.inherentKeepAlive) {
                    await this._sendMessage(this._cachedPingMessage);
                }
            }
            catch (e) {
                this._logger.log(LogLevel.Debug, `Hub handshake failed with error '${e}' during start(). Stopping HubConnection.`);
                this._cleanupTimeout();
                this._cleanupPingTimer();
                // HttpConnection.stop() should not complete until after the onclose callback is invoked.
                // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
                await this.connection.stop(e);
                throw e;
            }
        }
        /** Stops the connection.
         *
         * @returns {Promise<void>} A Promise that resolves when the connection has been successfully terminated, or rejects with an error.
         */
        async stop() {
            // Capture the start promise before the connection might be restarted in an onclose callback.
            const startPromise = this._startPromise;
            this.connection.features.reconnect = false;
            this._stopPromise = this._stopInternal();
            await this._stopPromise;
            try {
                // Awaiting undefined continues immediately
                await startPromise;
            }
            catch (e) {
                // This exception is returned to the user as a rejected Promise from the start method.
            }
        }
        _stopInternal(error) {
            if (this._connectionState === HubConnectionState.Disconnected) {
                this._logger.log(LogLevel.Debug, `Call to HubConnection.stop(${error}) ignored because it is already in the disconnected state.`);
                return Promise.resolve();
            }
            if (this._connectionState === HubConnectionState.Disconnecting) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
                return this._stopPromise;
            }
            const state = this._connectionState;
            this._connectionState = HubConnectionState.Disconnecting;
            this._logger.log(LogLevel.Debug, "Stopping HubConnection.");
            if (this._reconnectDelayHandle) {
                // We're in a reconnect delay which means the underlying connection is currently already stopped.
                // Just clear the handle to stop the reconnect loop (which no one is waiting on thankfully) and
                // fire the onclose callbacks.
                this._logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
                clearTimeout(this._reconnectDelayHandle);
                this._reconnectDelayHandle = undefined;
                this._completeClose();
                return Promise.resolve();
            }
            if (state === HubConnectionState.Connected) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this._sendCloseMessage();
            }
            this._cleanupTimeout();
            this._cleanupPingTimer();
            this._stopDuringStartError = error || new AbortError("The connection was stopped before the hub handshake could complete.");
            // HttpConnection.stop() should not complete until after either HttpConnection.start() fails
            // or the onclose callback is invoked. The onclose callback will transition the HubConnection
            // to the disconnected state if need be before HttpConnection.stop() completes.
            return this.connection.stop(error);
        }
        async _sendCloseMessage() {
            try {
                await this._sendWithProtocol(this._createCloseMessage());
            }
            catch {
                // Ignore, this is a best effort attempt to let the server know the client closed gracefully.
            }
        }
        /** Invokes a streaming hub method on the server using the specified name and arguments.
         *
         * @typeparam T The type of the items returned by the server.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {IStreamResult<T>} An object that yields results from the server as they are received.
         */
        stream(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const invocationDescriptor = this._createStreamInvocation(methodName, args, streamIds);
            // eslint-disable-next-line prefer-const
            let promiseQueue;
            const subject = new Subject();
            subject.cancelCallback = () => {
                const cancelInvocation = this._createCancelInvocation(invocationDescriptor.invocationId);
                delete this._callbacks[invocationDescriptor.invocationId];
                return promiseQueue.then(() => {
                    return this._sendWithProtocol(cancelInvocation);
                });
            };
            this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
                if (error) {
                    subject.error(error);
                    return;
                }
                else if (invocationEvent) {
                    // invocationEvent will not be null when an error is not passed to the callback
                    if (invocationEvent.type === MessageType.Completion) {
                        if (invocationEvent.error) {
                            subject.error(new Error(invocationEvent.error));
                        }
                        else {
                            subject.complete();
                        }
                    }
                    else {
                        subject.next((invocationEvent.item));
                    }
                }
            };
            promiseQueue = this._sendWithProtocol(invocationDescriptor)
                .catch((e) => {
                subject.error(e);
                delete this._callbacks[invocationDescriptor.invocationId];
            });
            this._launchStreams(streams, promiseQueue);
            return subject;
        }
        _sendMessage(message) {
            this._resetKeepAliveInterval();
            return this.connection.send(message);
        }
        /**
         * Sends a js object to the server.
         * @param message The js object to serialize and send.
         */
        _sendWithProtocol(message) {
            if (this._messageBuffer) {
                return this._messageBuffer._send(message);
            }
            else {
                return this._sendMessage(this._protocol.writeMessage(message));
            }
        }
        /** Invokes a hub method on the server using the specified name and arguments. Does not wait for a response from the receiver.
         *
         * The Promise returned by this method resolves when the client has sent the invocation to the server. The server may still
         * be processing the invocation.
         *
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<void>} A Promise that resolves when the invocation has been successfully sent, or rejects with an error.
         */
        send(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const sendPromise = this._sendWithProtocol(this._createInvocation(methodName, args, true, streamIds));
            this._launchStreams(streams, sendPromise);
            return sendPromise;
        }
        /** Invokes a hub method on the server using the specified name and arguments.
         *
         * The Promise returned by this method resolves when the server indicates it has finished invoking the method. When the promise
         * resolves, the server has finished invoking the method. If the server method returns a result, it is produced as the result of
         * resolving the Promise.
         *
         * @typeparam T The expected return type.
         * @param {string} methodName The name of the server method to invoke.
         * @param {any[]} args The arguments used to invoke the server method.
         * @returns {Promise<T>} A Promise that resolves with the result of the server method (if any), or rejects with an error.
         */
        invoke(methodName, ...args) {
            const [streams, streamIds] = this._replaceStreamingParams(args);
            const invocationDescriptor = this._createInvocation(methodName, args, false, streamIds);
            const p = new Promise((resolve, reject) => {
                // invocationId will always have a value for a non-blocking invocation
                this._callbacks[invocationDescriptor.invocationId] = (invocationEvent, error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    else if (invocationEvent) {
                        // invocationEvent will not be null when an error is not passed to the callback
                        if (invocationEvent.type === MessageType.Completion) {
                            if (invocationEvent.error) {
                                reject(new Error(invocationEvent.error));
                            }
                            else {
                                resolve(invocationEvent.result);
                            }
                        }
                        else {
                            reject(new Error(`Unexpected message type: ${invocationEvent.type}`));
                        }
                    }
                };
                const promiseQueue = this._sendWithProtocol(invocationDescriptor)
                    .catch((e) => {
                    reject(e);
                    // invocationId will always have a value for a non-blocking invocation
                    delete this._callbacks[invocationDescriptor.invocationId];
                });
                this._launchStreams(streams, promiseQueue);
            });
            return p;
        }
        on(methodName, newMethod) {
            if (!methodName || !newMethod) {
                return;
            }
            methodName = methodName.toLowerCase();
            if (!this._methods[methodName]) {
                this._methods[methodName] = [];
            }
            // Preventing adding the same handler multiple times.
            if (this._methods[methodName].indexOf(newMethod) !== -1) {
                return;
            }
            this._methods[methodName].push(newMethod);
        }
        off(methodName, method) {
            if (!methodName) {
                return;
            }
            methodName = methodName.toLowerCase();
            const handlers = this._methods[methodName];
            if (!handlers) {
                return;
            }
            if (method) {
                const removeIdx = handlers.indexOf(method);
                if (removeIdx !== -1) {
                    handlers.splice(removeIdx, 1);
                    if (handlers.length === 0) {
                        delete this._methods[methodName];
                    }
                }
            }
            else {
                delete this._methods[methodName];
            }
        }
        /** Registers a handler that will be invoked when the connection is closed.
         *
         * @param {Function} callback The handler that will be invoked when the connection is closed. Optionally receives a single argument containing the error that caused the connection to close (if any).
         */
        onclose(callback) {
            if (callback) {
                this._closedCallbacks.push(callback);
            }
        }
        /** Registers a handler that will be invoked when the connection starts reconnecting.
         *
         * @param {Function} callback The handler that will be invoked when the connection starts reconnecting. Optionally receives a single argument containing the error that caused the connection to start reconnecting (if any).
         */
        onreconnecting(callback) {
            if (callback) {
                this._reconnectingCallbacks.push(callback);
            }
        }
        /** Registers a handler that will be invoked when the connection successfully reconnects.
         *
         * @param {Function} callback The handler that will be invoked when the connection successfully reconnects.
         */
        onreconnected(callback) {
            if (callback) {
                this._reconnectedCallbacks.push(callback);
            }
        }
        _processIncomingData(data) {
            this._cleanupTimeout();
            if (!this._receivedHandshakeResponse) {
                data = this._processHandshakeResponse(data);
                this._receivedHandshakeResponse = true;
            }
            // Data may have all been read when processing handshake response
            if (data) {
                // Parse the messages
                const messages = this._protocol.parseMessages(data, this._logger);
                for (const message of messages) {
                    if (this._messageBuffer && !this._messageBuffer._shouldProcessMessage(message)) {
                        // Don't process the message, we are either waiting for a SequenceMessage or received a duplicate message
                        continue;
                    }
                    switch (message.type) {
                        case MessageType.Invocation:
                            this._invokeClientMethod(message)
                                .catch((e) => {
                                this._logger.log(LogLevel.Error, `Invoke client method threw error: ${getErrorString(e)}`);
                            });
                            break;
                        case MessageType.StreamItem:
                        case MessageType.Completion: {
                            const callback = this._callbacks[message.invocationId];
                            if (callback) {
                                if (message.type === MessageType.Completion) {
                                    delete this._callbacks[message.invocationId];
                                }
                                try {
                                    callback(message);
                                }
                                catch (e) {
                                    this._logger.log(LogLevel.Error, `Stream callback threw error: ${getErrorString(e)}`);
                                }
                            }
                            break;
                        }
                        case MessageType.Ping:
                            // Don't care about pings
                            break;
                        case MessageType.Close: {
                            this._logger.log(LogLevel.Information, "Close message received from server.");
                            const error = message.error ? new Error("Server returned an error on close: " + message.error) : undefined;
                            if (message.allowReconnect === true) {
                                // It feels wrong not to await connection.stop() here, but processIncomingData is called as part of an onreceive callback which is not async,
                                // this is already the behavior for serverTimeout(), and HttpConnection.Stop() should catch and log all possible exceptions.
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                this.connection.stop(error);
                            }
                            else {
                                // We cannot await stopInternal() here, but subsequent calls to stop() will await this if stopInternal() is still ongoing.
                                this._stopPromise = this._stopInternal(error);
                            }
                            break;
                        }
                        case MessageType.Ack:
                            if (this._messageBuffer) {
                                this._messageBuffer._ack(message);
                            }
                            break;
                        case MessageType.Sequence:
                            if (this._messageBuffer) {
                                this._messageBuffer._resetSequence(message);
                            }
                            break;
                        default:
                            this._logger.log(LogLevel.Warning, `Invalid message type: ${message.type}.`);
                            break;
                    }
                }
            }
            this._resetTimeoutPeriod();
        }
        _processHandshakeResponse(data) {
            let responseMessage;
            let remainingData;
            try {
                [remainingData, responseMessage] = this._handshakeProtocol.parseHandshakeResponse(data);
            }
            catch (e) {
                const message = "Error parsing handshake response: " + e;
                this._logger.log(LogLevel.Error, message);
                const error = new Error(message);
                this._handshakeRejecter(error);
                throw error;
            }
            if (responseMessage.error) {
                const message = "Server returned handshake error: " + responseMessage.error;
                this._logger.log(LogLevel.Error, message);
                const error = new Error(message);
                this._handshakeRejecter(error);
                throw error;
            }
            else {
                this._logger.log(LogLevel.Debug, "Server handshake complete.");
            }
            this._handshakeResolver();
            return remainingData;
        }
        _resetKeepAliveInterval() {
            if (this.connection.features.inherentKeepAlive) {
                return;
            }
            // Set the time we want the next keep alive to be sent
            // Timer will be setup on next message receive
            this._nextKeepAlive = new Date().getTime() + this.keepAliveIntervalInMilliseconds;
            this._cleanupPingTimer();
        }
        _resetTimeoutPeriod() {
            if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
                // Set the timeout timer
                this._timeoutHandle = setTimeout(() => this.serverTimeout(), this.serverTimeoutInMilliseconds);
                // Set keepAlive timer if there isn't one
                if (this._pingServerHandle === undefined) {
                    let nextPing = this._nextKeepAlive - new Date().getTime();
                    if (nextPing < 0) {
                        nextPing = 0;
                    }
                    // The timer needs to be set from a networking callback to avoid Chrome timer throttling from causing timers to run once a minute
                    this._pingServerHandle = setTimeout(async () => {
                        if (this._connectionState === HubConnectionState.Connected) {
                            try {
                                await this._sendMessage(this._cachedPingMessage);
                            }
                            catch {
                                // We don't care about the error. It should be seen elsewhere in the client.
                                // The connection is probably in a bad or closed state now, cleanup the timer so it stops triggering
                                this._cleanupPingTimer();
                            }
                        }
                    }, nextPing);
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        serverTimeout() {
            // The server hasn't talked to us in a while. It doesn't like us anymore ... :(
            // Terminate the connection, but we don't need to wait on the promise. This could trigger reconnecting.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
        }
        async _invokeClientMethod(invocationMessage) {
            const methodName = invocationMessage.target.toLowerCase();
            const methods = this._methods[methodName];
            if (!methods) {
                this._logger.log(LogLevel.Warning, `No client method with the name '${methodName}' found.`);
                // No handlers provided by client but the server is expecting a response still, so we send an error
                if (invocationMessage.invocationId) {
                    this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                    await this._sendWithProtocol(this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null));
                }
                return;
            }
            // Avoid issues with handlers removing themselves thus modifying the list while iterating through it
            const methodsCopy = methods.slice();
            // Server expects a response
            const expectsResponse = invocationMessage.invocationId ? true : false;
            // We preserve the last result or exception but still call all handlers
            let res;
            let exception;
            let completionMessage;
            for (const m of methodsCopy) {
                try {
                    const prevRes = res;
                    res = await m.apply(this, invocationMessage.arguments);
                    if (expectsResponse && res && prevRes) {
                        this._logger.log(LogLevel.Error, `Multiple results provided for '${methodName}'. Sending error to server.`);
                        completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `Client provided multiple results.`, null);
                    }
                    // Ignore exception if we got a result after, the exception will be logged
                    exception = undefined;
                }
                catch (e) {
                    exception = e;
                    this._logger.log(LogLevel.Error, `A callback for the method '${methodName}' threw error '${e}'.`);
                }
            }
            if (completionMessage) {
                await this._sendWithProtocol(completionMessage);
            }
            else if (expectsResponse) {
                // If there is an exception that means either no result was given or a handler after a result threw
                if (exception) {
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, `${exception}`, null);
                }
                else if (res !== undefined) {
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, null, res);
                }
                else {
                    this._logger.log(LogLevel.Warning, `No result given for '${methodName}' method and invocation ID '${invocationMessage.invocationId}'.`);
                    // Client didn't provide a result or throw from a handler, server expects a response so we send an error
                    completionMessage = this._createCompletionMessage(invocationMessage.invocationId, "Client didn't provide a result.", null);
                }
                await this._sendWithProtocol(completionMessage);
            }
            else {
                if (res) {
                    this._logger.log(LogLevel.Error, `Result given for '${methodName}' method but server is not expecting a result.`);
                }
            }
        }
        _connectionClosed(error) {
            this._logger.log(LogLevel.Debug, `HubConnection.connectionClosed(${error}) called while in state ${this._connectionState}.`);
            // Triggering this.handshakeRejecter is insufficient because it could already be resolved without the continuation having run yet.
            this._stopDuringStartError = this._stopDuringStartError || error || new AbortError("The underlying connection was closed before the hub handshake could complete.");
            // If the handshake is in progress, start will be waiting for the handshake promise, so we complete it.
            // If it has already completed, this should just noop.
            if (this._handshakeResolver) {
                this._handshakeResolver();
            }
            this._cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));
            this._cleanupTimeout();
            this._cleanupPingTimer();
            if (this._connectionState === HubConnectionState.Disconnecting) {
                this._completeClose(error);
            }
            else if (this._connectionState === HubConnectionState.Connected && this._reconnectPolicy) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this._reconnect(error);
            }
            else if (this._connectionState === HubConnectionState.Connected) {
                this._completeClose(error);
            }
            // If none of the above if conditions were true were called the HubConnection must be in either:
            // 1. The Connecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail it.
            // 2. The Reconnecting state in which case the handshakeResolver will complete it and stopDuringStartError will fail the current reconnect attempt
            //    and potentially continue the reconnect() loop.
            // 3. The Disconnected state in which case we're already done.
        }
        _completeClose(error) {
            if (this._connectionStarted) {
                this._connectionState = HubConnectionState.Disconnected;
                this._connectionStarted = false;
                if (this._messageBuffer) {
                    this._messageBuffer._dispose(error !== null && error !== void 0 ? error : new Error("Connection closed."));
                    this._messageBuffer = undefined;
                }
                if (Platform.isBrowser) {
                    window.document.removeEventListener("freeze", this._freezeEventListener);
                }
                try {
                    this._closedCallbacks.forEach((c) => c.apply(this, [error]));
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `An onclose callback called with error '${error}' threw error '${e}'.`);
                }
            }
        }
        async _reconnect(error) {
            const reconnectStartTime = Date.now();
            let previousReconnectAttempts = 0;
            let retryError = error !== undefined ? error : new Error("Attempting to reconnect due to a unknown error.");
            let nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, 0, retryError);
            if (nextRetryDelay === null) {
                this._logger.log(LogLevel.Debug, "Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt.");
                this._completeClose(error);
                return;
            }
            this._connectionState = HubConnectionState.Reconnecting;
            if (error) {
                this._logger.log(LogLevel.Information, `Connection reconnecting because of error '${error}'.`);
            }
            else {
                this._logger.log(LogLevel.Information, "Connection reconnecting.");
            }
            if (this._reconnectingCallbacks.length !== 0) {
                try {
                    this._reconnectingCallbacks.forEach((c) => c.apply(this, [error]));
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `An onreconnecting callback called with error '${error}' threw error '${e}'.`);
                }
                // Exit early if an onreconnecting callback called connection.stop().
                if (this._connectionState !== HubConnectionState.Reconnecting) {
                    this._logger.log(LogLevel.Debug, "Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");
                    return;
                }
            }
            while (nextRetryDelay !== null) {
                this._logger.log(LogLevel.Information, `Reconnect attempt number ${previousReconnectAttempts} will start in ${nextRetryDelay} ms.`);
                await new Promise((resolve) => {
                    this._reconnectDelayHandle = setTimeout(resolve, nextRetryDelay);
                });
                this._reconnectDelayHandle = undefined;
                if (this._connectionState !== HubConnectionState.Reconnecting) {
                    this._logger.log(LogLevel.Debug, "Connection left the reconnecting state during reconnect delay. Done reconnecting.");
                    return;
                }
                try {
                    await this._startInternal();
                    this._connectionState = HubConnectionState.Connected;
                    this._logger.log(LogLevel.Information, "HubConnection reconnected successfully.");
                    if (this._reconnectedCallbacks.length !== 0) {
                        try {
                            this._reconnectedCallbacks.forEach((c) => c.apply(this, [this.connection.connectionId]));
                        }
                        catch (e) {
                            this._logger.log(LogLevel.Error, `An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${e}'.`);
                        }
                    }
                    return;
                }
                catch (e) {
                    this._logger.log(LogLevel.Information, `Reconnect attempt failed because of error '${e}'.`);
                    if (this._connectionState !== HubConnectionState.Reconnecting) {
                        this._logger.log(LogLevel.Debug, `Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`);
                        // The TypeScript compiler thinks that connectionState must be Connected here. The TypeScript compiler is wrong.
                        if (this._connectionState === HubConnectionState.Disconnecting) {
                            this._completeClose();
                        }
                        return;
                    }
                    retryError = e instanceof Error ? e : new Error(e.toString());
                    nextRetryDelay = this._getNextRetryDelay(previousReconnectAttempts++, Date.now() - reconnectStartTime, retryError);
                }
            }
            this._logger.log(LogLevel.Information, `Reconnect retries have been exhausted after ${Date.now() - reconnectStartTime} ms and ${previousReconnectAttempts} failed attempts. Connection disconnecting.`);
            this._completeClose();
        }
        _getNextRetryDelay(previousRetryCount, elapsedMilliseconds, retryReason) {
            try {
                return this._reconnectPolicy.nextRetryDelayInMilliseconds({
                    elapsedMilliseconds,
                    previousRetryCount,
                    retryReason,
                });
            }
            catch (e) {
                this._logger.log(LogLevel.Error, `IRetryPolicy.nextRetryDelayInMilliseconds(${previousRetryCount}, ${elapsedMilliseconds}) threw error '${e}'.`);
                return null;
            }
        }
        _cancelCallbacksWithError(error) {
            const callbacks = this._callbacks;
            this._callbacks = {};
            Object.keys(callbacks)
                .forEach((key) => {
                const callback = callbacks[key];
                try {
                    callback(null, error);
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `Stream 'error' callback called with '${error}' threw error: ${getErrorString(e)}`);
                }
            });
        }
        _cleanupPingTimer() {
            if (this._pingServerHandle) {
                clearTimeout(this._pingServerHandle);
                this._pingServerHandle = undefined;
            }
        }
        _cleanupTimeout() {
            if (this._timeoutHandle) {
                clearTimeout(this._timeoutHandle);
            }
        }
        _createInvocation(methodName, args, nonblocking, streamIds) {
            if (nonblocking) {
                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        streamIds,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
                else {
                    return {
                        arguments: args,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
            }
            else {
                const invocationId = this._invocationId;
                this._invocationId++;
                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        streamIds,
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
                else {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        target: methodName,
                        type: MessageType.Invocation,
                    };
                }
            }
        }
        _launchStreams(streams, promiseQueue) {
            if (streams.length === 0) {
                return;
            }
            // Synchronize stream data so they arrive in-order on the server
            if (!promiseQueue) {
                promiseQueue = Promise.resolve();
            }
            // We want to iterate over the keys, since the keys are the stream ids
            // eslint-disable-next-line guard-for-in
            for (const streamId in streams) {
                streams[streamId].subscribe({
                    complete: () => {
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId)));
                    },
                    error: (err) => {
                        let message;
                        if (err instanceof Error) {
                            message = err.message;
                        }
                        else if (err && err.toString) {
                            message = err.toString();
                        }
                        else {
                            message = "Unknown error";
                        }
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createCompletionMessage(streamId, message)));
                    },
                    next: (item) => {
                        promiseQueue = promiseQueue.then(() => this._sendWithProtocol(this._createStreamItemMessage(streamId, item)));
                    },
                });
            }
        }
        _replaceStreamingParams(args) {
            const streams = [];
            const streamIds = [];
            for (let i = 0; i < args.length; i++) {
                const argument = args[i];
                if (this._isObservable(argument)) {
                    const streamId = this._invocationId;
                    this._invocationId++;
                    // Store the stream for later use
                    streams[streamId] = argument;
                    streamIds.push(streamId.toString());
                    // remove stream from args
                    args.splice(i, 1);
                }
            }
            return [streams, streamIds];
        }
        _isObservable(arg) {
            // This allows other stream implementations to just work (like rxjs)
            return arg && arg.subscribe && typeof arg.subscribe === "function";
        }
        _createStreamInvocation(methodName, args, streamIds) {
            const invocationId = this._invocationId;
            this._invocationId++;
            if (streamIds.length !== 0) {
                return {
                    arguments: args,
                    invocationId: invocationId.toString(),
                    streamIds,
                    target: methodName,
                    type: MessageType.StreamInvocation,
                };
            }
            else {
                return {
                    arguments: args,
                    invocationId: invocationId.toString(),
                    target: methodName,
                    type: MessageType.StreamInvocation,
                };
            }
        }
        _createCancelInvocation(id) {
            return {
                invocationId: id,
                type: MessageType.CancelInvocation,
            };
        }
        _createStreamItemMessage(id, item) {
            return {
                invocationId: id,
                item,
                type: MessageType.StreamItem,
            };
        }
        _createCompletionMessage(id, error, result) {
            if (error) {
                return {
                    error,
                    invocationId: id,
                    type: MessageType.Completion,
                };
            }
            return {
                invocationId: id,
                result,
                type: MessageType.Completion,
            };
        }
        _createCloseMessage() {
            return { type: MessageType.Close };
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // 0, 2, 10, 30 second delays before reconnect attempts.
    const DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2000, 10000, 30000, null];
    /** @private */
    class DefaultReconnectPolicy {
        constructor(retryDelays) {
            this._retryDelays = retryDelays !== undefined ? [...retryDelays, null] : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
        }
        nextRetryDelayInMilliseconds(retryContext) {
            return this._retryDelays[retryContext.previousRetryCount];
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    class HeaderNames {
    }
    HeaderNames.Authorization = "Authorization";
    HeaderNames.Cookie = "Cookie";

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** @private */
    class AccessTokenHttpClient extends HttpClient {
        constructor(innerClient, accessTokenFactory) {
            super();
            this._innerClient = innerClient;
            this._accessTokenFactory = accessTokenFactory;
        }
        async send(request) {
            let allowRetry = true;
            if (this._accessTokenFactory && (!this._accessToken || (request.url && request.url.indexOf("/negotiate?") > 0))) {
                // don't retry if the request is a negotiate or if we just got a potentially new token from the access token factory
                allowRetry = false;
                this._accessToken = await this._accessTokenFactory();
            }
            this._setAuthorizationHeader(request);
            const response = await this._innerClient.send(request);
            if (allowRetry && response.statusCode === 401 && this._accessTokenFactory) {
                this._accessToken = await this._accessTokenFactory();
                this._setAuthorizationHeader(request);
                return await this._innerClient.send(request);
            }
            return response;
        }
        _setAuthorizationHeader(request) {
            if (!request.headers) {
                request.headers = {};
            }
            if (this._accessToken) {
                request.headers[HeaderNames.Authorization] = `Bearer ${this._accessToken}`;
            }
            // don't remove the header if there isn't an access token factory, the user manually added the header in this case
            else if (this._accessTokenFactory) {
                if (request.headers[HeaderNames.Authorization]) {
                    delete request.headers[HeaderNames.Authorization];
                }
            }
        }
        getCookieString(url) {
            return this._innerClient.getCookieString(url);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // This will be treated as a bit flag in the future, so we keep it using power-of-two values.
    /** Specifies a specific HTTP transport type. */
    var HttpTransportType;
    (function (HttpTransportType) {
        /** Specifies no transport preference. */
        HttpTransportType[HttpTransportType["None"] = 0] = "None";
        /** Specifies the WebSockets transport. */
        HttpTransportType[HttpTransportType["WebSockets"] = 1] = "WebSockets";
        /** Specifies the Server-Sent Events transport. */
        HttpTransportType[HttpTransportType["ServerSentEvents"] = 2] = "ServerSentEvents";
        /** Specifies the Long Polling transport. */
        HttpTransportType[HttpTransportType["LongPolling"] = 4] = "LongPolling";
    })(HttpTransportType || (HttpTransportType = {}));
    /** Specifies the transfer format for a connection. */
    var TransferFormat;
    (function (TransferFormat) {
        /** Specifies that only text data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Text"] = 1] = "Text";
        /** Specifies that binary data will be transmitted over the connection. */
        TransferFormat[TransferFormat["Binary"] = 2] = "Binary";
    })(TransferFormat || (TransferFormat = {}));

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Rough polyfill of https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    // We don't actually ever use the API being polyfilled, we always use the polyfill because
    // it's a very new API right now.
    // Not exported from index.
    /** @private */
    let AbortController$1 = class AbortController {
        constructor() {
            this._isAborted = false;
            this.onabort = null;
        }
        abort() {
            if (!this._isAborted) {
                this._isAborted = true;
                if (this.onabort) {
                    this.onabort();
                }
            }
        }
        get signal() {
            return this;
        }
        get aborted() {
            return this._isAborted;
        }
    };

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    // Not exported from 'index', this type is internal.
    /** @private */
    class LongPollingTransport {
        // This is an internal type, not exported from 'index' so this is really just internal.
        get pollAborted() {
            return this._pollAbort.aborted;
        }
        constructor(httpClient, logger, options) {
            this._httpClient = httpClient;
            this._logger = logger;
            this._pollAbort = new AbortController$1();
            this._options = options;
            this._running = false;
            this.onreceive = null;
            this.onclose = null;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._url = url;
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
            // Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
            if (transferFormat === TransferFormat.Binary &&
                (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
                throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
            }
            const [name, value] = getUserAgentHeader();
            const headers = { [name]: value, ...this._options.headers };
            const pollOptions = {
                abortSignal: this._pollAbort.signal,
                headers,
                timeout: 100000,
                withCredentials: this._options.withCredentials,
            };
            if (transferFormat === TransferFormat.Binary) {
                pollOptions.responseType = "arraybuffer";
            }
            // Make initial long polling request
            // Server uses first long polling request to finish initializing connection and it returns without data
            const pollUrl = `${url}&_=${Date.now()}`;
            this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
            const response = await this._httpClient.get(pollUrl, pollOptions);
            if (response.statusCode !== 200) {
                this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
                // Mark running as false so that the poll immediately ends and runs the close logic
                this._closeError = new HttpError(response.statusText || "", response.statusCode);
                this._running = false;
            }
            else {
                this._running = true;
            }
            this._receiving = this._poll(this._url, pollOptions);
        }
        async _poll(url, pollOptions) {
            try {
                while (this._running) {
                    try {
                        const pollUrl = `${url}&_=${Date.now()}`;
                        this._logger.log(LogLevel.Trace, `(LongPolling transport) polling: ${pollUrl}.`);
                        const response = await this._httpClient.get(pollUrl, pollOptions);
                        if (response.statusCode === 204) {
                            this._logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
                            this._running = false;
                        }
                        else if (response.statusCode !== 200) {
                            this._logger.log(LogLevel.Error, `(LongPolling transport) Unexpected response code: ${response.statusCode}.`);
                            // Unexpected status code
                            this._closeError = new HttpError(response.statusText || "", response.statusCode);
                            this._running = false;
                        }
                        else {
                            // Process the response
                            if (response.content) {
                                this._logger.log(LogLevel.Trace, `(LongPolling transport) data received. ${getDataDetail(response.content, this._options.logMessageContent)}.`);
                                if (this.onreceive) {
                                    this.onreceive(response.content);
                                }
                            }
                            else {
                                // This is another way timeout manifest.
                                this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                            }
                        }
                    }
                    catch (e) {
                        if (!this._running) {
                            // Log but disregard errors that occur after stopping
                            this._logger.log(LogLevel.Trace, `(LongPolling transport) Poll errored after shutdown: ${e.message}`);
                        }
                        else {
                            if (e instanceof TimeoutError) {
                                // Ignore timeouts and reissue the poll.
                                this._logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                            }
                            else {
                                // Close the connection with the error as the result.
                                this._closeError = e;
                                this._running = false;
                            }
                        }
                    }
                }
            }
            finally {
                this._logger.log(LogLevel.Trace, "(LongPolling transport) Polling complete.");
                // We will reach here with pollAborted==false when the server returned a response causing the transport to stop.
                // If pollAborted==true then client initiated the stop and the stop method will raise the close event after DELETE is sent.
                if (!this.pollAborted) {
                    this._raiseOnClose();
                }
            }
        }
        async send(data) {
            if (!this._running) {
                return Promise.reject(new Error("Cannot send until the transport is connected"));
            }
            return sendMessage(this._logger, "LongPolling", this._httpClient, this._url, data, this._options);
        }
        async stop() {
            this._logger.log(LogLevel.Trace, "(LongPolling transport) Stopping polling.");
            // Tell receiving loop to stop, abort any current request, and then wait for it to finish
            this._running = false;
            this._pollAbort.abort();
            try {
                await this._receiving;
                // Send DELETE to clean up long polling on the server
                this._logger.log(LogLevel.Trace, `(LongPolling transport) sending DELETE request to ${this._url}.`);
                const headers = {};
                const [name, value] = getUserAgentHeader();
                headers[name] = value;
                const deleteOptions = {
                    headers: { ...headers, ...this._options.headers },
                    timeout: this._options.timeout,
                    withCredentials: this._options.withCredentials,
                };
                let error;
                try {
                    await this._httpClient.delete(this._url, deleteOptions);
                }
                catch (err) {
                    error = err;
                }
                if (error) {
                    if (error instanceof HttpError) {
                        if (error.statusCode === 404) {
                            this._logger.log(LogLevel.Trace, "(LongPolling transport) A 404 response was returned from sending a DELETE request.");
                        }
                        else {
                            this._logger.log(LogLevel.Trace, `(LongPolling transport) Error sending a DELETE request: ${error}`);
                        }
                    }
                }
                else {
                    this._logger.log(LogLevel.Trace, "(LongPolling transport) DELETE request accepted.");
                }
            }
            finally {
                this._logger.log(LogLevel.Trace, "(LongPolling transport) Stop finished.");
                // Raise close event here instead of in polling
                // It needs to happen after the DELETE request is sent
                this._raiseOnClose();
            }
        }
        _raiseOnClose() {
            if (this.onclose) {
                let logMessage = "(LongPolling transport) Firing onclose event.";
                if (this._closeError) {
                    logMessage += " Error: " + this._closeError;
                }
                this._logger.log(LogLevel.Trace, logMessage);
                this.onclose(this._closeError);
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** @private */
    class ServerSentEventsTransport {
        constructor(httpClient, accessToken, logger, options) {
            this._httpClient = httpClient;
            this._accessToken = accessToken;
            this._logger = logger;
            this._options = options;
            this.onreceive = null;
            this.onclose = null;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Trace, "(SSE transport) Connecting.");
            // set url before accessTokenFactory because this._url is only for send and we set the auth header instead of the query string for send
            this._url = url;
            if (this._accessToken) {
                url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(this._accessToken)}`;
            }
            return new Promise((resolve, reject) => {
                let opened = false;
                if (transferFormat !== TransferFormat.Text) {
                    reject(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));
                    return;
                }
                let eventSource;
                if (Platform.isBrowser || Platform.isWebWorker) {
                    eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials });
                }
                else {
                    // Non-browser passes cookies via the dictionary
                    const cookies = this._httpClient.getCookieString(url);
                    const headers = {};
                    headers.Cookie = cookies;
                    const [name, value] = getUserAgentHeader();
                    headers[name] = value;
                    eventSource = new this._options.EventSource(url, { withCredentials: this._options.withCredentials, headers: { ...headers, ...this._options.headers } });
                }
                try {
                    eventSource.onmessage = (e) => {
                        if (this.onreceive) {
                            try {
                                this._logger.log(LogLevel.Trace, `(SSE transport) data received. ${getDataDetail(e.data, this._options.logMessageContent)}.`);
                                this.onreceive(e.data);
                            }
                            catch (error) {
                                this._close(error);
                                return;
                            }
                        }
                    };
                    // @ts-ignore: not using event on purpose
                    eventSource.onerror = (e) => {
                        // EventSource doesn't give any useful information about server side closes.
                        if (opened) {
                            this._close();
                        }
                        else {
                            reject(new Error("EventSource failed to connect. The connection could not be found on the server,"
                                + " either the connection ID is not present on the server, or a proxy is refusing/buffering the connection."
                                + " If you have multiple servers check that sticky sessions are enabled."));
                        }
                    };
                    eventSource.onopen = () => {
                        this._logger.log(LogLevel.Information, `SSE connected to ${this._url}`);
                        this._eventSource = eventSource;
                        opened = true;
                        resolve();
                    };
                }
                catch (e) {
                    reject(e);
                    return;
                }
            });
        }
        async send(data) {
            if (!this._eventSource) {
                return Promise.reject(new Error("Cannot send until the transport is connected"));
            }
            return sendMessage(this._logger, "SSE", this._httpClient, this._url, data, this._options);
        }
        stop() {
            this._close();
            return Promise.resolve();
        }
        _close(e) {
            if (this._eventSource) {
                this._eventSource.close();
                this._eventSource = undefined;
                if (this.onclose) {
                    this.onclose(e);
                }
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    /** @private */
    class WebSocketTransport {
        constructor(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
            this._logger = logger;
            this._accessTokenFactory = accessTokenFactory;
            this._logMessageContent = logMessageContent;
            this._webSocketConstructor = webSocketConstructor;
            this._httpClient = httpClient;
            this.onreceive = null;
            this.onclose = null;
            this._headers = headers;
        }
        async connect(url, transferFormat) {
            Arg.isRequired(url, "url");
            Arg.isRequired(transferFormat, "transferFormat");
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
            let token;
            if (this._accessTokenFactory) {
                token = await this._accessTokenFactory();
            }
            return new Promise((resolve, reject) => {
                url = url.replace(/^http/, "ws");
                let webSocket;
                const cookies = this._httpClient.getCookieString(url);
                let opened = false;
                if (Platform.isNode || Platform.isReactNative) {
                    const headers = {};
                    const [name, value] = getUserAgentHeader();
                    headers[name] = value;
                    if (token) {
                        headers[HeaderNames.Authorization] = `Bearer ${token}`;
                    }
                    if (cookies) {
                        headers[HeaderNames.Cookie] = cookies;
                    }
                    // Only pass headers when in non-browser environments
                    webSocket = new this._webSocketConstructor(url, undefined, {
                        headers: { ...headers, ...this._headers },
                    });
                }
                else {
                    if (token) {
                        url += (url.indexOf("?") < 0 ? "?" : "&") + `access_token=${encodeURIComponent(token)}`;
                    }
                }
                if (!webSocket) {
                    // Chrome is not happy with passing 'undefined' as protocol
                    webSocket = new this._webSocketConstructor(url);
                }
                if (transferFormat === TransferFormat.Binary) {
                    webSocket.binaryType = "arraybuffer";
                }
                webSocket.onopen = (_event) => {
                    this._logger.log(LogLevel.Information, `WebSocket connected to ${url}.`);
                    this._webSocket = webSocket;
                    opened = true;
                    resolve();
                };
                webSocket.onerror = (event) => {
                    let error = null;
                    // ErrorEvent is a browser only type we need to check if the type exists before using it
                    if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                        error = event.error;
                    }
                    else {
                        error = "There was an error with the transport";
                    }
                    this._logger.log(LogLevel.Information, `(WebSockets transport) ${error}.`);
                };
                webSocket.onmessage = (message) => {
                    this._logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this._logMessageContent)}.`);
                    if (this.onreceive) {
                        try {
                            this.onreceive(message.data);
                        }
                        catch (error) {
                            this._close(error);
                            return;
                        }
                    }
                };
                webSocket.onclose = (event) => {
                    // Don't call close handler if connection was never established
                    // We'll reject the connect call instead
                    if (opened) {
                        this._close(event);
                    }
                    else {
                        let error = null;
                        // ErrorEvent is a browser only type we need to check if the type exists before using it
                        if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                            error = event.error;
                        }
                        else {
                            error = "WebSocket failed to connect. The connection could not be found on the server,"
                                + " either the endpoint may not be a SignalR endpoint,"
                                + " the connection ID is not present on the server, or there is a proxy blocking WebSockets."
                                + " If you have multiple servers check that sticky sessions are enabled.";
                        }
                        reject(new Error(error));
                    }
                };
            });
        }
        send(data) {
            if (this._webSocket && this._webSocket.readyState === this._webSocketConstructor.OPEN) {
                this._logger.log(LogLevel.Trace, `(WebSockets transport) sending data. ${getDataDetail(data, this._logMessageContent)}.`);
                this._webSocket.send(data);
                return Promise.resolve();
            }
            return Promise.reject("WebSocket is not in the OPEN state");
        }
        stop() {
            if (this._webSocket) {
                // Manually invoke onclose callback inline so we know the HttpConnection was closed properly before returning
                // This also solves an issue where websocket.onclose could take 18+ seconds to trigger during network disconnects
                this._close(undefined);
            }
            return Promise.resolve();
        }
        _close(event) {
            // webSocket will be null if the transport did not start successfully
            if (this._webSocket) {
                // Clear websocket handlers because we are considering the socket closed now
                this._webSocket.onclose = () => { };
                this._webSocket.onmessage = () => { };
                this._webSocket.onerror = () => { };
                this._webSocket.close();
                this._webSocket = undefined;
            }
            this._logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
            if (this.onclose) {
                if (this._isCloseEvent(event) && (event.wasClean === false || event.code !== 1000)) {
                    this.onclose(new Error(`WebSocket closed with status code: ${event.code} (${event.reason || "no reason given"}).`));
                }
                else if (event instanceof Error) {
                    this.onclose(event);
                }
                else {
                    this.onclose();
                }
            }
        }
        _isCloseEvent(event) {
            return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    const MAX_REDIRECTS = 100;
    /** @private */
    class HttpConnection {
        constructor(url, options = {}) {
            this._stopPromiseResolver = () => { };
            this.features = {};
            this._negotiateVersion = 1;
            Arg.isRequired(url, "url");
            this._logger = createLogger(options.logger);
            this.baseUrl = this._resolveUrl(url);
            options = options || {};
            options.logMessageContent = options.logMessageContent === undefined ? false : options.logMessageContent;
            if (typeof options.withCredentials === "boolean" || options.withCredentials === undefined) {
                options.withCredentials = options.withCredentials === undefined ? true : options.withCredentials;
            }
            else {
                throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
            }
            options.timeout = options.timeout === undefined ? 100 * 1000 : options.timeout;
            let webSocketModule = null;
            let eventSourceModule = null;
            if (Platform.isNode && typeof require !== "undefined") {
                // In order to ignore the dynamic require in webpack builds we need to do this magic
                // @ts-ignore: TS doesn't know about these names
                const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
                webSocketModule = requireFunc("ws");
                eventSourceModule = requireFunc("eventsource");
            }
            if (!Platform.isNode && typeof WebSocket !== "undefined" && !options.WebSocket) {
                options.WebSocket = WebSocket;
            }
            else if (Platform.isNode && !options.WebSocket) {
                if (webSocketModule) {
                    options.WebSocket = webSocketModule;
                }
            }
            if (!Platform.isNode && typeof EventSource !== "undefined" && !options.EventSource) {
                options.EventSource = EventSource;
            }
            else if (Platform.isNode && !options.EventSource) {
                if (typeof eventSourceModule !== "undefined") {
                    options.EventSource = eventSourceModule;
                }
            }
            this._httpClient = new AccessTokenHttpClient(options.httpClient || new DefaultHttpClient(this._logger), options.accessTokenFactory);
            this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
            this._connectionStarted = false;
            this._options = options;
            this.onreceive = null;
            this.onclose = null;
        }
        async start(transferFormat) {
            transferFormat = transferFormat || TransferFormat.Binary;
            Arg.isIn(transferFormat, TransferFormat, "transferFormat");
            this._logger.log(LogLevel.Debug, `Starting connection with transfer format '${TransferFormat[transferFormat]}'.`);
            if (this._connectionState !== "Disconnected" /* ConnectionState.Disconnected */) {
                return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
            }
            this._connectionState = "Connecting" /* ConnectionState.Connecting */;
            this._startInternalPromise = this._startInternal(transferFormat);
            await this._startInternalPromise;
            // The TypeScript compiler thinks that connectionState must be Connecting here. The TypeScript compiler is wrong.
            if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
                // stop() was called and transitioned the client into the Disconnecting state.
                const message = "Failed to start the HttpConnection before stop() was called.";
                this._logger.log(LogLevel.Error, message);
                // We cannot await stopPromise inside startInternal since stopInternal awaits the startInternalPromise.
                await this._stopPromise;
                return Promise.reject(new AbortError(message));
            }
            else if (this._connectionState !== "Connected" /* ConnectionState.Connected */) {
                // stop() was called and transitioned the client into the Disconnecting state.
                const message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
                this._logger.log(LogLevel.Error, message);
                return Promise.reject(new AbortError(message));
            }
            this._connectionStarted = true;
        }
        send(data) {
            if (this._connectionState !== "Connected" /* ConnectionState.Connected */) {
                return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
            }
            if (!this._sendQueue) {
                this._sendQueue = new TransportSendQueue(this.transport);
            }
            // Transport will not be null if state is connected
            return this._sendQueue.send(data);
        }
        async stop(error) {
            if (this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnected state.`);
                return Promise.resolve();
            }
            if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stop(${error}) ignored because the connection is already in the disconnecting state.`);
                return this._stopPromise;
            }
            this._connectionState = "Disconnecting" /* ConnectionState.Disconnecting */;
            this._stopPromise = new Promise((resolve) => {
                // Don't complete stop() until stopConnection() completes.
                this._stopPromiseResolver = resolve;
            });
            // stopInternal should never throw so just observe it.
            await this._stopInternal(error);
            await this._stopPromise;
        }
        async _stopInternal(error) {
            // Set error as soon as possible otherwise there is a race between
            // the transport closing and providing an error and the error from a close message
            // We would prefer the close message error.
            this._stopError = error;
            try {
                await this._startInternalPromise;
            }
            catch (e) {
                // This exception is returned to the user as a rejected Promise from the start method.
            }
            // The transport's onclose will trigger stopConnection which will run our onclose event.
            // The transport should always be set if currently connected. If it wasn't set, it's likely because
            // stop was called during start() and start() failed.
            if (this.transport) {
                try {
                    await this.transport.stop();
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `HttpConnection.transport.stop() threw error '${e}'.`);
                    this._stopConnection();
                }
                this.transport = undefined;
            }
            else {
                this._logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
            }
        }
        async _startInternal(transferFormat) {
            // Store the original base url and the access token factory since they may change
            // as part of negotiating
            let url = this.baseUrl;
            this._accessTokenFactory = this._options.accessTokenFactory;
            this._httpClient._accessTokenFactory = this._accessTokenFactory;
            try {
                if (this._options.skipNegotiation) {
                    if (this._options.transport === HttpTransportType.WebSockets) {
                        // No need to add a connection ID in this case
                        this.transport = this._constructTransport(HttpTransportType.WebSockets);
                        // We should just call connect directly in this case.
                        // No fallback or negotiate in this case.
                        await this._startTransport(url, transferFormat);
                    }
                    else {
                        throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
                    }
                }
                else {
                    let negotiateResponse = null;
                    let redirects = 0;
                    do {
                        negotiateResponse = await this._getNegotiationResponse(url);
                        // the user tries to stop the connection when it is being started
                        if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */ || this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
                            throw new AbortError("The connection was stopped during negotiation.");
                        }
                        if (negotiateResponse.error) {
                            throw new Error(negotiateResponse.error);
                        }
                        if (negotiateResponse.ProtocolVersion) {
                            throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
                        }
                        if (negotiateResponse.url) {
                            url = negotiateResponse.url;
                        }
                        if (negotiateResponse.accessToken) {
                            // Replace the current access token factory with one that uses
                            // the returned access token
                            const accessToken = negotiateResponse.accessToken;
                            this._accessTokenFactory = () => accessToken;
                            // set the factory to undefined so the AccessTokenHttpClient won't retry with the same token, since we know it won't change until a connection restart
                            this._httpClient._accessToken = accessToken;
                            this._httpClient._accessTokenFactory = undefined;
                        }
                        redirects++;
                    } while (negotiateResponse.url && redirects < MAX_REDIRECTS);
                    if (redirects === MAX_REDIRECTS && negotiateResponse.url) {
                        throw new Error("Negotiate redirection limit exceeded.");
                    }
                    await this._createTransport(url, this._options.transport, negotiateResponse, transferFormat);
                }
                if (this.transport instanceof LongPollingTransport) {
                    this.features.inherentKeepAlive = true;
                }
                if (this._connectionState === "Connecting" /* ConnectionState.Connecting */) {
                    // Ensure the connection transitions to the connected state prior to completing this.startInternalPromise.
                    // start() will handle the case when stop was called and startInternal exits still in the disconnecting state.
                    this._logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
                    this._connectionState = "Connected" /* ConnectionState.Connected */;
                }
                // stop() is waiting on us via this.startInternalPromise so keep this.transport around so it can clean up.
                // This is the only case startInternal can exit in neither the connected nor disconnected state because stopConnection()
                // will transition to the disconnected state. start() will wait for the transition using the stopPromise.
            }
            catch (e) {
                this._logger.log(LogLevel.Error, "Failed to start the connection: " + e);
                this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
                this.transport = undefined;
                // if start fails, any active calls to stop assume that start will complete the stop promise
                this._stopPromiseResolver();
                return Promise.reject(e);
            }
        }
        async _getNegotiationResponse(url) {
            const headers = {};
            const [name, value] = getUserAgentHeader();
            headers[name] = value;
            const negotiateUrl = this._resolveNegotiateUrl(url);
            this._logger.log(LogLevel.Debug, `Sending negotiation request: ${negotiateUrl}.`);
            try {
                const response = await this._httpClient.post(negotiateUrl, {
                    content: "",
                    headers: { ...headers, ...this._options.headers },
                    timeout: this._options.timeout,
                    withCredentials: this._options.withCredentials,
                });
                if (response.statusCode !== 200) {
                    return Promise.reject(new Error(`Unexpected status code returned from negotiate '${response.statusCode}'`));
                }
                const negotiateResponse = JSON.parse(response.content);
                if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
                    // Negotiate version 0 doesn't use connectionToken
                    // So we set it equal to connectionId so all our logic can use connectionToken without being aware of the negotiate version
                    negotiateResponse.connectionToken = negotiateResponse.connectionId;
                }
                if (negotiateResponse.useStatefulReconnect && this._options._useStatefulReconnect !== true) {
                    return Promise.reject(new FailedToNegotiateWithServerError("Client didn't negotiate Stateful Reconnect but the server did."));
                }
                return negotiateResponse;
            }
            catch (e) {
                let errorMessage = "Failed to complete negotiation with the server: " + e;
                if (e instanceof HttpError) {
                    if (e.statusCode === 404) {
                        errorMessage = errorMessage + " Either this is not a SignalR endpoint or there is a proxy blocking the connection.";
                    }
                }
                this._logger.log(LogLevel.Error, errorMessage);
                return Promise.reject(new FailedToNegotiateWithServerError(errorMessage));
            }
        }
        _createConnectUrl(url, connectionToken) {
            if (!connectionToken) {
                return url;
            }
            return url + (url.indexOf("?") === -1 ? "?" : "&") + `id=${connectionToken}`;
        }
        async _createTransport(url, requestedTransport, negotiateResponse, requestedTransferFormat) {
            let connectUrl = this._createConnectUrl(url, negotiateResponse.connectionToken);
            if (this._isITransport(requestedTransport)) {
                this._logger.log(LogLevel.Debug, "Connection was provided an instance of ITransport, using that directly.");
                this.transport = requestedTransport;
                await this._startTransport(connectUrl, requestedTransferFormat);
                this.connectionId = negotiateResponse.connectionId;
                return;
            }
            const transportExceptions = [];
            const transports = negotiateResponse.availableTransports || [];
            let negotiate = negotiateResponse;
            for (const endpoint of transports) {
                const transportOrError = this._resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, (negotiate === null || negotiate === void 0 ? void 0 : negotiate.useStatefulReconnect) === true);
                if (transportOrError instanceof Error) {
                    // Store the error and continue, we don't want to cause a re-negotiate in these cases
                    transportExceptions.push(`${endpoint.transport} failed:`);
                    transportExceptions.push(transportOrError);
                }
                else if (this._isITransport(transportOrError)) {
                    this.transport = transportOrError;
                    if (!negotiate) {
                        try {
                            negotiate = await this._getNegotiationResponse(url);
                        }
                        catch (ex) {
                            return Promise.reject(ex);
                        }
                        connectUrl = this._createConnectUrl(url, negotiate.connectionToken);
                    }
                    try {
                        await this._startTransport(connectUrl, requestedTransferFormat);
                        this.connectionId = negotiate.connectionId;
                        return;
                    }
                    catch (ex) {
                        this._logger.log(LogLevel.Error, `Failed to start the transport '${endpoint.transport}': ${ex}`);
                        negotiate = undefined;
                        transportExceptions.push(new FailedToStartTransportError(`${endpoint.transport} failed: ${ex}`, HttpTransportType[endpoint.transport]));
                        if (this._connectionState !== "Connecting" /* ConnectionState.Connecting */) {
                            const message = "Failed to select transport before stop() was called.";
                            this._logger.log(LogLevel.Debug, message);
                            return Promise.reject(new AbortError(message));
                        }
                    }
                }
            }
            if (transportExceptions.length > 0) {
                return Promise.reject(new AggregateErrors(`Unable to connect to the server with any of the available transports. ${transportExceptions.join(" ")}`, transportExceptions));
            }
            return Promise.reject(new Error("None of the transports supported by the client are supported by the server."));
        }
        _constructTransport(transport) {
            switch (transport) {
                case HttpTransportType.WebSockets:
                    if (!this._options.WebSocket) {
                        throw new Error("'WebSocket' is not supported in your environment.");
                    }
                    return new WebSocketTransport(this._httpClient, this._accessTokenFactory, this._logger, this._options.logMessageContent, this._options.WebSocket, this._options.headers || {});
                case HttpTransportType.ServerSentEvents:
                    if (!this._options.EventSource) {
                        throw new Error("'EventSource' is not supported in your environment.");
                    }
                    return new ServerSentEventsTransport(this._httpClient, this._httpClient._accessToken, this._logger, this._options);
                case HttpTransportType.LongPolling:
                    return new LongPollingTransport(this._httpClient, this._logger, this._options);
                default:
                    throw new Error(`Unknown transport: ${transport}.`);
            }
        }
        _startTransport(url, transferFormat) {
            this.transport.onreceive = this.onreceive;
            if (this.features.reconnect) {
                this.transport.onclose = async (e) => {
                    let callStop = false;
                    if (this.features.reconnect) {
                        try {
                            this.features.disconnected();
                            await this.transport.connect(url, transferFormat);
                            await this.features.resend();
                        }
                        catch {
                            callStop = true;
                        }
                    }
                    else {
                        this._stopConnection(e);
                        return;
                    }
                    if (callStop) {
                        this._stopConnection(e);
                    }
                };
            }
            else {
                this.transport.onclose = (e) => this._stopConnection(e);
            }
            return this.transport.connect(url, transferFormat);
        }
        _resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat, useStatefulReconnect) {
            const transport = HttpTransportType[endpoint.transport];
            if (transport === null || transport === undefined) {
                this._logger.log(LogLevel.Debug, `Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
                return new Error(`Skipping transport '${endpoint.transport}' because it is not supported by this client.`);
            }
            else {
                if (transportMatches(requestedTransport, transport)) {
                    const transferFormats = endpoint.transferFormats.map((s) => TransferFormat[s]);
                    if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
                        if ((transport === HttpTransportType.WebSockets && !this._options.WebSocket) ||
                            (transport === HttpTransportType.ServerSentEvents && !this._options.EventSource)) {
                            this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it is not supported in your environment.'`);
                            return new UnsupportedTransportError(`'${HttpTransportType[transport]}' is not supported in your environment.`, transport);
                        }
                        else {
                            this._logger.log(LogLevel.Debug, `Selecting transport '${HttpTransportType[transport]}'.`);
                            try {
                                this.features.reconnect = transport === HttpTransportType.WebSockets ? useStatefulReconnect : undefined;
                                return this._constructTransport(transport);
                            }
                            catch (ex) {
                                return ex;
                            }
                        }
                    }
                    else {
                        this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it does not support the requested transfer format '${TransferFormat[requestedTransferFormat]}'.`);
                        return new Error(`'${HttpTransportType[transport]}' does not support ${TransferFormat[requestedTransferFormat]}.`);
                    }
                }
                else {
                    this._logger.log(LogLevel.Debug, `Skipping transport '${HttpTransportType[transport]}' because it was disabled by the client.`);
                    return new DisabledTransportError(`'${HttpTransportType[transport]}' is disabled by the client.`, transport);
                }
            }
        }
        _isITransport(transport) {
            return transport && typeof (transport) === "object" && "connect" in transport;
        }
        _stopConnection(error) {
            this._logger.log(LogLevel.Debug, `HttpConnection.stopConnection(${error}) called while in state ${this._connectionState}.`);
            this.transport = undefined;
            // If we have a stopError, it takes precedence over the error from the transport
            error = this._stopError || error;
            this._stopError = undefined;
            if (this._connectionState === "Disconnected" /* ConnectionState.Disconnected */) {
                this._logger.log(LogLevel.Debug, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is already in the disconnected state.`);
                return;
            }
            if (this._connectionState === "Connecting" /* ConnectionState.Connecting */) {
                this._logger.log(LogLevel.Warning, `Call to HttpConnection.stopConnection(${error}) was ignored because the connection is still in the connecting state.`);
                throw new Error(`HttpConnection.stopConnection(${error}) was called while the connection is still in the connecting state.`);
            }
            if (this._connectionState === "Disconnecting" /* ConnectionState.Disconnecting */) {
                // A call to stop() induced this call to stopConnection and needs to be completed.
                // Any stop() awaiters will be scheduled to continue after the onclose callback fires.
                this._stopPromiseResolver();
            }
            if (error) {
                this._logger.log(LogLevel.Error, `Connection disconnected with error '${error}'.`);
            }
            else {
                this._logger.log(LogLevel.Information, "Connection disconnected.");
            }
            if (this._sendQueue) {
                this._sendQueue.stop().catch((e) => {
                    this._logger.log(LogLevel.Error, `TransportSendQueue.stop() threw error '${e}'.`);
                });
                this._sendQueue = undefined;
            }
            this.connectionId = undefined;
            this._connectionState = "Disconnected" /* ConnectionState.Disconnected */;
            if (this._connectionStarted) {
                this._connectionStarted = false;
                try {
                    if (this.onclose) {
                        this.onclose(error);
                    }
                }
                catch (e) {
                    this._logger.log(LogLevel.Error, `HttpConnection.onclose(${error}) threw error '${e}'.`);
                }
            }
        }
        _resolveUrl(url) {
            // startsWith is not supported in IE
            if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
                return url;
            }
            if (!Platform.isBrowser) {
                throw new Error(`Cannot resolve '${url}'.`);
            }
            // Setting the url to the href propery of an anchor tag handles normalization
            // for us. There are 3 main cases.
            // 1. Relative path normalization e.g "b" -> "http://localhost:5000/a/b"
            // 2. Absolute path normalization e.g "/a/b" -> "http://localhost:5000/a/b"
            // 3. Networkpath reference normalization e.g "//localhost:5000/a/b" -> "http://localhost:5000/a/b"
            const aTag = window.document.createElement("a");
            aTag.href = url;
            this._logger.log(LogLevel.Information, `Normalizing '${url}' to '${aTag.href}'.`);
            return aTag.href;
        }
        _resolveNegotiateUrl(url) {
            const negotiateUrl = new URL(url);
            if (negotiateUrl.pathname.endsWith('/')) {
                negotiateUrl.pathname += "negotiate";
            }
            else {
                negotiateUrl.pathname += "/negotiate";
            }
            const searchParams = new URLSearchParams(negotiateUrl.searchParams);
            if (!searchParams.has("negotiateVersion")) {
                searchParams.append("negotiateVersion", this._negotiateVersion.toString());
            }
            if (searchParams.has("useStatefulReconnect")) {
                if (searchParams.get("useStatefulReconnect") === "true") {
                    this._options._useStatefulReconnect = true;
                }
            }
            else if (this._options._useStatefulReconnect === true) {
                searchParams.append("useStatefulReconnect", "true");
            }
            negotiateUrl.search = searchParams.toString();
            return negotiateUrl.toString();
        }
    }
    function transportMatches(requestedTransport, actualTransport) {
        return !requestedTransport || ((actualTransport & requestedTransport) !== 0);
    }
    /** @private */
    class TransportSendQueue {
        constructor(_transport) {
            this._transport = _transport;
            this._buffer = [];
            this._executing = true;
            this._sendBufferedData = new PromiseSource();
            this._transportResult = new PromiseSource();
            this._sendLoopPromise = this._sendLoop();
        }
        send(data) {
            this._bufferData(data);
            if (!this._transportResult) {
                this._transportResult = new PromiseSource();
            }
            return this._transportResult.promise;
        }
        stop() {
            this._executing = false;
            this._sendBufferedData.resolve();
            return this._sendLoopPromise;
        }
        _bufferData(data) {
            if (this._buffer.length && typeof (this._buffer[0]) !== typeof (data)) {
                throw new Error(`Expected data to be of type ${typeof (this._buffer)} but was of type ${typeof (data)}`);
            }
            this._buffer.push(data);
            this._sendBufferedData.resolve();
        }
        async _sendLoop() {
            while (true) {
                await this._sendBufferedData.promise;
                if (!this._executing) {
                    if (this._transportResult) {
                        this._transportResult.reject("Connection stopped.");
                    }
                    break;
                }
                this._sendBufferedData = new PromiseSource();
                const transportResult = this._transportResult;
                this._transportResult = undefined;
                const data = typeof (this._buffer[0]) === "string" ?
                    this._buffer.join("") :
                    TransportSendQueue._concatBuffers(this._buffer);
                this._buffer.length = 0;
                try {
                    await this._transport.send(data);
                    transportResult.resolve();
                }
                catch (error) {
                    transportResult.reject(error);
                }
            }
        }
        static _concatBuffers(arrayBuffers) {
            const totalLength = arrayBuffers.map((b) => b.byteLength).reduce((a, b) => a + b);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const item of arrayBuffers) {
                result.set(new Uint8Array(item), offset);
                offset += item.byteLength;
            }
            return result.buffer;
        }
    }
    class PromiseSource {
        constructor() {
            this.promise = new Promise((resolve, reject) => [this._resolver, this._rejecter] = [resolve, reject]);
        }
        resolve() {
            this._resolver();
        }
        reject(reason) {
            this._rejecter(reason);
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    const JSON_HUB_PROTOCOL_NAME = "json";
    /** Implements the JSON Hub Protocol. */
    class JsonHubProtocol {
        constructor() {
            /** @inheritDoc */
            this.name = JSON_HUB_PROTOCOL_NAME;
            /** @inheritDoc */
            this.version = 2;
            /** @inheritDoc */
            this.transferFormat = TransferFormat.Text;
        }
        /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
         *
         * @param {string} input A string containing the serialized representation.
         * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
         */
        parseMessages(input, logger) {
            // The interface does allow "ArrayBuffer" to be passed in, but this implementation does not. So let's throw a useful error.
            if (typeof input !== "string") {
                throw new Error("Invalid input for JSON hub protocol. Expected a string.");
            }
            if (!input) {
                return [];
            }
            if (logger === null) {
                logger = NullLogger.instance;
            }
            // Parse the messages
            const messages = TextMessageFormat.parse(input);
            const hubMessages = [];
            for (const message of messages) {
                const parsedMessage = JSON.parse(message);
                if (typeof parsedMessage.type !== "number") {
                    throw new Error("Invalid payload.");
                }
                switch (parsedMessage.type) {
                    case MessageType.Invocation:
                        this._isInvocationMessage(parsedMessage);
                        break;
                    case MessageType.StreamItem:
                        this._isStreamItemMessage(parsedMessage);
                        break;
                    case MessageType.Completion:
                        this._isCompletionMessage(parsedMessage);
                        break;
                    case MessageType.Ping:
                        // Single value, no need to validate
                        break;
                    case MessageType.Close:
                        // All optional values, no need to validate
                        break;
                    case MessageType.Ack:
                        this._isAckMessage(parsedMessage);
                        break;
                    case MessageType.Sequence:
                        this._isSequenceMessage(parsedMessage);
                        break;
                    default:
                        // Future protocol changes can add message types, old clients can ignore them
                        logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.");
                        continue;
                }
                hubMessages.push(parsedMessage);
            }
            return hubMessages;
        }
        /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
         *
         * @param {HubMessage} message The message to write.
         * @returns {string} A string containing the serialized representation of the message.
         */
        writeMessage(message) {
            return TextMessageFormat.write(JSON.stringify(message));
        }
        _isInvocationMessage(message) {
            this._assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
            if (message.invocationId !== undefined) {
                this._assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
            }
        }
        _isStreamItemMessage(message) {
            this._assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
            if (message.item === undefined) {
                throw new Error("Invalid payload for StreamItem message.");
            }
        }
        _isCompletionMessage(message) {
            if (message.result && message.error) {
                throw new Error("Invalid payload for Completion message.");
            }
            if (!message.result && message.error) {
                this._assertNotEmptyString(message.error, "Invalid payload for Completion message.");
            }
            this._assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
        }
        _isAckMessage(message) {
            if (typeof message.sequenceId !== 'number') {
                throw new Error("Invalid SequenceId for Ack message.");
            }
        }
        _isSequenceMessage(message) {
            if (typeof message.sequenceId !== 'number') {
                throw new Error("Invalid SequenceId for Sequence message.");
            }
        }
        _assertNotEmptyString(value, errorMessage) {
            if (typeof value !== "string" || value === "") {
                throw new Error(errorMessage);
            }
        }
    }

    // Licensed to the .NET Foundation under one or more agreements.
    // The .NET Foundation licenses this file to you under the MIT license.
    const LogLevelNameMapping = {
        trace: LogLevel.Trace,
        debug: LogLevel.Debug,
        info: LogLevel.Information,
        information: LogLevel.Information,
        warn: LogLevel.Warning,
        warning: LogLevel.Warning,
        error: LogLevel.Error,
        critical: LogLevel.Critical,
        none: LogLevel.None,
    };
    function parseLogLevel(name) {
        // Case-insensitive matching via lower-casing
        // Yes, I know case-folding is a complicated problem in Unicode, but we only support
        // the ASCII strings defined in LogLevelNameMapping anyway, so it's fine -anurse.
        const mapping = LogLevelNameMapping[name.toLowerCase()];
        if (typeof mapping !== "undefined") {
            return mapping;
        }
        else {
            throw new Error(`Unknown log level: ${name}`);
        }
    }
    /** A builder for configuring {@link @microsoft/signalr.HubConnection} instances. */
    class HubConnectionBuilder {
        configureLogging(logging) {
            Arg.isRequired(logging, "logging");
            if (isLogger(logging)) {
                this.logger = logging;
            }
            else if (typeof logging === "string") {
                const logLevel = parseLogLevel(logging);
                this.logger = new ConsoleLogger(logLevel);
            }
            else {
                this.logger = new ConsoleLogger(logging);
            }
            return this;
        }
        withUrl(url, transportTypeOrOptions) {
            Arg.isRequired(url, "url");
            Arg.isNotEmpty(url, "url");
            this.url = url;
            // Flow-typing knows where it's at. Since HttpTransportType is a number and IHttpConnectionOptions is guaranteed
            // to be an object, we know (as does TypeScript) this comparison is all we need to figure out which overload was called.
            if (typeof transportTypeOrOptions === "object") {
                this.httpConnectionOptions = { ...this.httpConnectionOptions, ...transportTypeOrOptions };
            }
            else {
                this.httpConnectionOptions = {
                    ...this.httpConnectionOptions,
                    transport: transportTypeOrOptions,
                };
            }
            return this;
        }
        /** Configures the {@link @microsoft/signalr.HubConnection} to use the specified Hub Protocol.
         *
         * @param {IHubProtocol} protocol The {@link @microsoft/signalr.IHubProtocol} implementation to use.
         */
        withHubProtocol(protocol) {
            Arg.isRequired(protocol, "protocol");
            this.protocol = protocol;
            return this;
        }
        withAutomaticReconnect(retryDelaysOrReconnectPolicy) {
            if (this.reconnectPolicy) {
                throw new Error("A reconnectPolicy has already been set.");
            }
            if (!retryDelaysOrReconnectPolicy) {
                this.reconnectPolicy = new DefaultReconnectPolicy();
            }
            else if (Array.isArray(retryDelaysOrReconnectPolicy)) {
                this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
            }
            else {
                this.reconnectPolicy = retryDelaysOrReconnectPolicy;
            }
            return this;
        }
        /** Configures {@link @microsoft/signalr.HubConnection.serverTimeoutInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
         *
         * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
         */
        withServerTimeout(milliseconds) {
            Arg.isRequired(milliseconds, "milliseconds");
            this._serverTimeoutInMilliseconds = milliseconds;
            return this;
        }
        /** Configures {@link @microsoft/signalr.HubConnection.keepAliveIntervalInMilliseconds} for the {@link @microsoft/signalr.HubConnection}.
         *
         * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
         */
        withKeepAliveInterval(milliseconds) {
            Arg.isRequired(milliseconds, "milliseconds");
            this._keepAliveIntervalInMilliseconds = milliseconds;
            return this;
        }
        /** Enables and configures options for the Stateful Reconnect feature.
         *
         * @returns The {@link @microsoft/signalr.HubConnectionBuilder} instance, for chaining.
         */
        withStatefulReconnect(options) {
            if (this.httpConnectionOptions === undefined) {
                this.httpConnectionOptions = {};
            }
            this.httpConnectionOptions._useStatefulReconnect = true;
            this._statefulReconnectBufferSize = options === null || options === void 0 ? void 0 : options.bufferSize;
            return this;
        }
        /** Creates a {@link @microsoft/signalr.HubConnection} from the configuration options specified in this builder.
         *
         * @returns {HubConnection} The configured {@link @microsoft/signalr.HubConnection}.
         */
        build() {
            // If httpConnectionOptions has a logger, use it. Otherwise, override it with the one
            // provided to configureLogger
            const httpConnectionOptions = this.httpConnectionOptions || {};
            // If it's 'null', the user **explicitly** asked for null, don't mess with it.
            if (httpConnectionOptions.logger === undefined) {
                // If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
                httpConnectionOptions.logger = this.logger;
            }
            // Now create the connection
            if (!this.url) {
                throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
            }
            const connection = new HttpConnection(this.url, httpConnectionOptions);
            return HubConnection.create(connection, this.logger || NullLogger.instance, this.protocol || new JsonHubProtocol(), this.reconnectPolicy, this._serverTimeoutInMilliseconds, this._keepAliveIntervalInMilliseconds, this._statefulReconnectBufferSize);
        }
    }
    function isLogger(logger) {
        return logger.log !== undefined;
    }

    function utf8Count(str) {
        const strLength = str.length;
        let byteLength = 0;
        let pos = 0;
        while (pos < strLength) {
            let value = str.charCodeAt(pos++);
            if ((value & 0xffffff80) === 0) {
                // 1-byte
                byteLength++;
                continue;
            }
            else if ((value & 0xfffff800) === 0) {
                // 2-bytes
                byteLength += 2;
            }
            else {
                // handle surrogate pair
                if (value >= 0xd800 && value <= 0xdbff) {
                    // high surrogate
                    if (pos < strLength) {
                        const extra = str.charCodeAt(pos);
                        if ((extra & 0xfc00) === 0xdc00) {
                            ++pos;
                            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                    }
                }
                if ((value & 0xffff0000) === 0) {
                    // 3-byte
                    byteLength += 3;
                }
                else {
                    // 4-byte
                    byteLength += 4;
                }
            }
        }
        return byteLength;
    }
    function utf8EncodeJs(str, output, outputOffset) {
        const strLength = str.length;
        let offset = outputOffset;
        let pos = 0;
        while (pos < strLength) {
            let value = str.charCodeAt(pos++);
            if ((value & 0xffffff80) === 0) {
                // 1-byte
                output[offset++] = value;
                continue;
            }
            else if ((value & 0xfffff800) === 0) {
                // 2-bytes
                output[offset++] = ((value >> 6) & 0x1f) | 0xc0;
            }
            else {
                // handle surrogate pair
                if (value >= 0xd800 && value <= 0xdbff) {
                    // high surrogate
                    if (pos < strLength) {
                        const extra = str.charCodeAt(pos);
                        if ((extra & 0xfc00) === 0xdc00) {
                            ++pos;
                            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                    }
                }
                if ((value & 0xffff0000) === 0) {
                    // 3-byte
                    output[offset++] = ((value >> 12) & 0x0f) | 0xe0;
                    output[offset++] = ((value >> 6) & 0x3f) | 0x80;
                }
                else {
                    // 4-byte
                    output[offset++] = ((value >> 18) & 0x07) | 0xf0;
                    output[offset++] = ((value >> 12) & 0x3f) | 0x80;
                    output[offset++] = ((value >> 6) & 0x3f) | 0x80;
                }
            }
            output[offset++] = (value & 0x3f) | 0x80;
        }
    }
    // TextEncoder and TextDecoder are standardized in whatwg encoding:
    // https://encoding.spec.whatwg.org/
    // and available in all the modern browsers:
    // https://caniuse.com/textencoder
    // They are available in Node.js since v12 LTS as well:
    // https://nodejs.org/api/globals.html#textencoder
    const sharedTextEncoder = new TextEncoder();
    // This threshold should be determined by benchmarking, which might vary in engines and input data.
    // Run `npx ts-node benchmark/encode-string.ts` for details.
    const TEXT_ENCODER_THRESHOLD = 50;
    function utf8EncodeTE(str, output, outputOffset) {
        sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
    }
    function utf8Encode(str, output, outputOffset) {
        if (str.length > TEXT_ENCODER_THRESHOLD) {
            utf8EncodeTE(str, output, outputOffset);
        }
        else {
            utf8EncodeJs(str, output, outputOffset);
        }
    }
    const CHUNK_SIZE = 4096;
    function utf8DecodeJs(bytes, inputOffset, byteLength) {
        let offset = inputOffset;
        const end = offset + byteLength;
        const units = [];
        let result = "";
        while (offset < end) {
            const byte1 = bytes[offset++];
            if ((byte1 & 0x80) === 0) {
                // 1 byte
                units.push(byte1);
            }
            else if ((byte1 & 0xe0) === 0xc0) {
                // 2 bytes
                const byte2 = bytes[offset++] & 0x3f;
                units.push(((byte1 & 0x1f) << 6) | byte2);
            }
            else if ((byte1 & 0xf0) === 0xe0) {
                // 3 bytes
                const byte2 = bytes[offset++] & 0x3f;
                const byte3 = bytes[offset++] & 0x3f;
                units.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
            }
            else if ((byte1 & 0xf8) === 0xf0) {
                // 4 bytes
                const byte2 = bytes[offset++] & 0x3f;
                const byte3 = bytes[offset++] & 0x3f;
                const byte4 = bytes[offset++] & 0x3f;
                let unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
                if (unit > 0xffff) {
                    unit -= 0x10000;
                    units.push(((unit >>> 10) & 0x3ff) | 0xd800);
                    unit = 0xdc00 | (unit & 0x3ff);
                }
                units.push(unit);
            }
            else {
                units.push(byte1);
            }
            if (units.length >= CHUNK_SIZE) {
                result += String.fromCharCode(...units);
                units.length = 0;
            }
        }
        if (units.length > 0) {
            result += String.fromCharCode(...units);
        }
        return result;
    }
    const sharedTextDecoder = new TextDecoder();
    // This threshold should be determined by benchmarking, which might vary in engines and input data.
    // Run `npx ts-node benchmark/decode-string.ts` for details.
    const TEXT_DECODER_THRESHOLD = 200;
    function utf8DecodeTD(bytes, inputOffset, byteLength) {
        const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
        return sharedTextDecoder.decode(stringBytes);
    }
    function utf8Decode(bytes, inputOffset, byteLength) {
        if (byteLength > TEXT_DECODER_THRESHOLD) {
            return utf8DecodeTD(bytes, inputOffset, byteLength);
        }
        else {
            return utf8DecodeJs(bytes, inputOffset, byteLength);
        }
    }

    /**
     * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
     */
    class ExtData {
        constructor(type, data) {
            this.type = type;
            this.data = data;
        }
    }

    class DecodeError extends Error {
        constructor(message) {
            super(message);
            // fix the prototype chain in a cross-platform way
            const proto = Object.create(DecodeError.prototype);
            Object.setPrototypeOf(this, proto);
            Object.defineProperty(this, "name", {
                configurable: true,
                enumerable: false,
                value: DecodeError.name,
            });
        }
    }

    // Integer Utility
    const UINT32_MAX = 4294967295;
    // DataView extension to handle int64 / uint64,
    // where the actual range is 53-bits integer (a.k.a. safe integer)
    function setUint64(view, offset, value) {
        const high = value / 4294967296;
        const low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function setInt64(view, offset, value) {
        const high = Math.floor(value / 4294967296);
        const low = value; // high bits are truncated by DataView
        view.setUint32(offset, high);
        view.setUint32(offset + 4, low);
    }
    function getInt64(view, offset) {
        const high = view.getInt32(offset);
        const low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }
    function getUint64(view, offset) {
        const high = view.getUint32(offset);
        const low = view.getUint32(offset + 4);
        return high * 4294967296 + low;
    }

    // https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type
    const EXT_TIMESTAMP = -1;
    const TIMESTAMP32_MAX_SEC = 0x100000000 - 1; // 32-bit unsigned int
    const TIMESTAMP64_MAX_SEC = 0x400000000 - 1; // 34-bit unsigned int
    function encodeTimeSpecToTimestamp({ sec, nsec }) {
        if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
            // Here sec >= 0 && nsec >= 0
            if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
                // timestamp 32 = { sec32 (unsigned) }
                const rv = new Uint8Array(4);
                const view = new DataView(rv.buffer);
                view.setUint32(0, sec);
                return rv;
            }
            else {
                // timestamp 64 = { nsec30 (unsigned), sec34 (unsigned) }
                const secHigh = sec / 0x100000000;
                const secLow = sec & 0xffffffff;
                const rv = new Uint8Array(8);
                const view = new DataView(rv.buffer);
                // nsec30 | secHigh2
                view.setUint32(0, (nsec << 2) | (secHigh & 0x3));
                // secLow32
                view.setUint32(4, secLow);
                return rv;
            }
        }
        else {
            // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
            const rv = new Uint8Array(12);
            const view = new DataView(rv.buffer);
            view.setUint32(0, nsec);
            setInt64(view, 4, sec);
            return rv;
        }
    }
    function encodeDateToTimeSpec(date) {
        const msec = date.getTime();
        const sec = Math.floor(msec / 1e3);
        const nsec = (msec - sec * 1e3) * 1e6;
        // Normalizes { sec, nsec } to ensure nsec is unsigned.
        const nsecInSec = Math.floor(nsec / 1e9);
        return {
            sec: sec + nsecInSec,
            nsec: nsec - nsecInSec * 1e9,
        };
    }
    function encodeTimestampExtension(object) {
        if (object instanceof Date) {
            const timeSpec = encodeDateToTimeSpec(object);
            return encodeTimeSpecToTimestamp(timeSpec);
        }
        else {
            return null;
        }
    }
    function decodeTimestampToTimeSpec(data) {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        // data may be 32, 64, or 96 bits
        switch (data.byteLength) {
            case 4: {
                // timestamp 32 = { sec32 }
                const sec = view.getUint32(0);
                const nsec = 0;
                return { sec, nsec };
            }
            case 8: {
                // timestamp 64 = { nsec30, sec34 }
                const nsec30AndSecHigh2 = view.getUint32(0);
                const secLow32 = view.getUint32(4);
                const sec = (nsec30AndSecHigh2 & 0x3) * 0x100000000 + secLow32;
                const nsec = nsec30AndSecHigh2 >>> 2;
                return { sec, nsec };
            }
            case 12: {
                // timestamp 96 = { nsec32 (unsigned), sec64 (signed) }
                const sec = getInt64(view, 4);
                const nsec = view.getUint32(0);
                return { sec, nsec };
            }
            default:
                throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
        }
    }
    function decodeTimestampExtension(data) {
        const timeSpec = decodeTimestampToTimeSpec(data);
        return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
    }
    const timestampExtension = {
        type: EXT_TIMESTAMP,
        encode: encodeTimestampExtension,
        decode: decodeTimestampExtension,
    };

    // ExtensionCodec to handle MessagePack extensions
    class ExtensionCodec {
        constructor() {
            // built-in extensions
            this.builtInEncoders = [];
            this.builtInDecoders = [];
            // custom extensions
            this.encoders = [];
            this.decoders = [];
            this.register(timestampExtension);
        }
        register({ type, encode, decode, }) {
            if (type >= 0) {
                // custom extensions
                this.encoders[type] = encode;
                this.decoders[type] = decode;
            }
            else {
                // built-in extensions
                const index = -1 - type;
                this.builtInEncoders[index] = encode;
                this.builtInDecoders[index] = decode;
            }
        }
        tryToEncode(object, context) {
            // built-in extensions
            for (let i = 0; i < this.builtInEncoders.length; i++) {
                const encodeExt = this.builtInEncoders[i];
                if (encodeExt != null) {
                    const data = encodeExt(object, context);
                    if (data != null) {
                        const type = -1 - i;
                        return new ExtData(type, data);
                    }
                }
            }
            // custom extensions
            for (let i = 0; i < this.encoders.length; i++) {
                const encodeExt = this.encoders[i];
                if (encodeExt != null) {
                    const data = encodeExt(object, context);
                    if (data != null) {
                        const type = i;
                        return new ExtData(type, data);
                    }
                }
            }
            if (object instanceof ExtData) {
                // to keep ExtData as is
                return object;
            }
            return null;
        }
        decode(data, type, context) {
            const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
            if (decodeExt) {
                return decodeExt(data, type, context);
            }
            else {
                // decode() does not fail, returns ExtData instead.
                return new ExtData(type, data);
            }
        }
    }
    ExtensionCodec.defaultCodec = new ExtensionCodec();

    function isArrayBufferLike(buffer) {
        return (buffer instanceof ArrayBuffer || (typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer));
    }
    function ensureUint8Array(buffer) {
        if (buffer instanceof Uint8Array) {
            return buffer;
        }
        else if (ArrayBuffer.isView(buffer)) {
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
        else if (isArrayBufferLike(buffer)) {
            return new Uint8Array(buffer);
        }
        else {
            // ArrayLike<number>
            return Uint8Array.from(buffer);
        }
    }

    const DEFAULT_MAX_DEPTH = 100;
    const DEFAULT_INITIAL_BUFFER_SIZE = 2048;
    class Encoder {
        constructor(options) {
            this.entered = false;
            this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
            this.context = options?.context; // needs a type assertion because EncoderOptions has no context property when ContextType is undefined
            this.useBigInt64 = options?.useBigInt64 ?? false;
            this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
            this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
            this.sortKeys = options?.sortKeys ?? false;
            this.forceFloat32 = options?.forceFloat32 ?? false;
            this.ignoreUndefined = options?.ignoreUndefined ?? false;
            this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
            this.pos = 0;
            this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
            this.bytes = new Uint8Array(this.view.buffer);
        }
        clone() {
            // Because of slightly special argument `context`,
            // type assertion is needed.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new Encoder({
                extensionCodec: this.extensionCodec,
                context: this.context,
                useBigInt64: this.useBigInt64,
                maxDepth: this.maxDepth,
                initialBufferSize: this.initialBufferSize,
                sortKeys: this.sortKeys,
                forceFloat32: this.forceFloat32,
                ignoreUndefined: this.ignoreUndefined,
                forceIntegerToFloat: this.forceIntegerToFloat,
            });
        }
        reinitializeState() {
            this.pos = 0;
        }
        /**
         * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
         *
         * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
         */
        encodeSharedRef(object) {
            if (this.entered) {
                const instance = this.clone();
                return instance.encodeSharedRef(object);
            }
            try {
                this.entered = true;
                this.reinitializeState();
                this.doEncode(object, 1);
                return this.bytes.subarray(0, this.pos);
            }
            finally {
                this.entered = false;
            }
        }
        /**
         * @returns Encodes the object and returns a copy of the encoder's internal buffer.
         */
        encode(object) {
            if (this.entered) {
                const instance = this.clone();
                return instance.encode(object);
            }
            try {
                this.entered = true;
                this.reinitializeState();
                this.doEncode(object, 1);
                return this.bytes.slice(0, this.pos);
            }
            finally {
                this.entered = false;
            }
        }
        doEncode(object, depth) {
            if (depth > this.maxDepth) {
                throw new Error(`Too deep objects in depth ${depth}`);
            }
            if (object == null) {
                this.encodeNil();
            }
            else if (typeof object === "boolean") {
                this.encodeBoolean(object);
            }
            else if (typeof object === "number") {
                if (!this.forceIntegerToFloat) {
                    this.encodeNumber(object);
                }
                else {
                    this.encodeNumberAsFloat(object);
                }
            }
            else if (typeof object === "string") {
                this.encodeString(object);
            }
            else if (this.useBigInt64 && typeof object === "bigint") {
                this.encodeBigInt64(object);
            }
            else {
                this.encodeObject(object, depth);
            }
        }
        ensureBufferSizeToWrite(sizeToWrite) {
            const requiredSize = this.pos + sizeToWrite;
            if (this.view.byteLength < requiredSize) {
                this.resizeBuffer(requiredSize * 2);
            }
        }
        resizeBuffer(newSize) {
            const newBuffer = new ArrayBuffer(newSize);
            const newBytes = new Uint8Array(newBuffer);
            const newView = new DataView(newBuffer);
            newBytes.set(this.bytes);
            this.view = newView;
            this.bytes = newBytes;
        }
        encodeNil() {
            this.writeU8(0xc0);
        }
        encodeBoolean(object) {
            if (object === false) {
                this.writeU8(0xc2);
            }
            else {
                this.writeU8(0xc3);
            }
        }
        encodeNumber(object) {
            if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
                if (object >= 0) {
                    if (object < 0x80) {
                        // positive fixint
                        this.writeU8(object);
                    }
                    else if (object < 0x100) {
                        // uint 8
                        this.writeU8(0xcc);
                        this.writeU8(object);
                    }
                    else if (object < 0x10000) {
                        // uint 16
                        this.writeU8(0xcd);
                        this.writeU16(object);
                    }
                    else if (object < 0x100000000) {
                        // uint 32
                        this.writeU8(0xce);
                        this.writeU32(object);
                    }
                    else if (!this.useBigInt64) {
                        // uint 64
                        this.writeU8(0xcf);
                        this.writeU64(object);
                    }
                    else {
                        this.encodeNumberAsFloat(object);
                    }
                }
                else {
                    if (object >= -32) {
                        // negative fixint
                        this.writeU8(0xe0 | (object + 0x20));
                    }
                    else if (object >= -128) {
                        // int 8
                        this.writeU8(0xd0);
                        this.writeI8(object);
                    }
                    else if (object >= -32768) {
                        // int 16
                        this.writeU8(0xd1);
                        this.writeI16(object);
                    }
                    else if (object >= -2147483648) {
                        // int 32
                        this.writeU8(0xd2);
                        this.writeI32(object);
                    }
                    else if (!this.useBigInt64) {
                        // int 64
                        this.writeU8(0xd3);
                        this.writeI64(object);
                    }
                    else {
                        this.encodeNumberAsFloat(object);
                    }
                }
            }
            else {
                this.encodeNumberAsFloat(object);
            }
        }
        encodeNumberAsFloat(object) {
            if (this.forceFloat32) {
                // float 32
                this.writeU8(0xca);
                this.writeF32(object);
            }
            else {
                // float 64
                this.writeU8(0xcb);
                this.writeF64(object);
            }
        }
        encodeBigInt64(object) {
            if (object >= BigInt(0)) {
                // uint 64
                this.writeU8(0xcf);
                this.writeBigUint64(object);
            }
            else {
                // int 64
                this.writeU8(0xd3);
                this.writeBigInt64(object);
            }
        }
        writeStringHeader(byteLength) {
            if (byteLength < 32) {
                // fixstr
                this.writeU8(0xa0 + byteLength);
            }
            else if (byteLength < 0x100) {
                // str 8
                this.writeU8(0xd9);
                this.writeU8(byteLength);
            }
            else if (byteLength < 0x10000) {
                // str 16
                this.writeU8(0xda);
                this.writeU16(byteLength);
            }
            else if (byteLength < 0x100000000) {
                // str 32
                this.writeU8(0xdb);
                this.writeU32(byteLength);
            }
            else {
                throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
            }
        }
        encodeString(object) {
            const maxHeaderSize = 1 + 4;
            const byteLength = utf8Count(object);
            this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
            this.writeStringHeader(byteLength);
            utf8Encode(object, this.bytes, this.pos);
            this.pos += byteLength;
        }
        encodeObject(object, depth) {
            // try to encode objects with custom codec first of non-primitives
            const ext = this.extensionCodec.tryToEncode(object, this.context);
            if (ext != null) {
                this.encodeExtension(ext);
            }
            else if (Array.isArray(object)) {
                this.encodeArray(object, depth);
            }
            else if (ArrayBuffer.isView(object)) {
                this.encodeBinary(object);
            }
            else if (typeof object === "object") {
                this.encodeMap(object, depth);
            }
            else {
                // symbol, function and other special object come here unless extensionCodec handles them.
                throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
            }
        }
        encodeBinary(object) {
            const size = object.byteLength;
            if (size < 0x100) {
                // bin 8
                this.writeU8(0xc4);
                this.writeU8(size);
            }
            else if (size < 0x10000) {
                // bin 16
                this.writeU8(0xc5);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // bin 32
                this.writeU8(0xc6);
                this.writeU32(size);
            }
            else {
                throw new Error(`Too large binary: ${size}`);
            }
            const bytes = ensureUint8Array(object);
            this.writeU8a(bytes);
        }
        encodeArray(object, depth) {
            const size = object.length;
            if (size < 16) {
                // fixarray
                this.writeU8(0x90 + size);
            }
            else if (size < 0x10000) {
                // array 16
                this.writeU8(0xdc);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // array 32
                this.writeU8(0xdd);
                this.writeU32(size);
            }
            else {
                throw new Error(`Too large array: ${size}`);
            }
            for (const item of object) {
                this.doEncode(item, depth + 1);
            }
        }
        countWithoutUndefined(object, keys) {
            let count = 0;
            for (const key of keys) {
                if (object[key] !== undefined) {
                    count++;
                }
            }
            return count;
        }
        encodeMap(object, depth) {
            const keys = Object.keys(object);
            if (this.sortKeys) {
                keys.sort();
            }
            const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
            if (size < 16) {
                // fixmap
                this.writeU8(0x80 + size);
            }
            else if (size < 0x10000) {
                // map 16
                this.writeU8(0xde);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // map 32
                this.writeU8(0xdf);
                this.writeU32(size);
            }
            else {
                throw new Error(`Too large map object: ${size}`);
            }
            for (const key of keys) {
                const value = object[key];
                if (!(this.ignoreUndefined && value === undefined)) {
                    this.encodeString(key);
                    this.doEncode(value, depth + 1);
                }
            }
        }
        encodeExtension(ext) {
            if (typeof ext.data === "function") {
                const data = ext.data(this.pos + 6);
                const size = data.length;
                if (size >= 0x100000000) {
                    throw new Error(`Too large extension object: ${size}`);
                }
                this.writeU8(0xc9);
                this.writeU32(size);
                this.writeI8(ext.type);
                this.writeU8a(data);
                return;
            }
            const size = ext.data.length;
            if (size === 1) {
                // fixext 1
                this.writeU8(0xd4);
            }
            else if (size === 2) {
                // fixext 2
                this.writeU8(0xd5);
            }
            else if (size === 4) {
                // fixext 4
                this.writeU8(0xd6);
            }
            else if (size === 8) {
                // fixext 8
                this.writeU8(0xd7);
            }
            else if (size === 16) {
                // fixext 16
                this.writeU8(0xd8);
            }
            else if (size < 0x100) {
                // ext 8
                this.writeU8(0xc7);
                this.writeU8(size);
            }
            else if (size < 0x10000) {
                // ext 16
                this.writeU8(0xc8);
                this.writeU16(size);
            }
            else if (size < 0x100000000) {
                // ext 32
                this.writeU8(0xc9);
                this.writeU32(size);
            }
            else {
                throw new Error(`Too large extension object: ${size}`);
            }
            this.writeI8(ext.type);
            this.writeU8a(ext.data);
        }
        writeU8(value) {
            this.ensureBufferSizeToWrite(1);
            this.view.setUint8(this.pos, value);
            this.pos++;
        }
        writeU8a(values) {
            const size = values.length;
            this.ensureBufferSizeToWrite(size);
            this.bytes.set(values, this.pos);
            this.pos += size;
        }
        writeI8(value) {
            this.ensureBufferSizeToWrite(1);
            this.view.setInt8(this.pos, value);
            this.pos++;
        }
        writeU16(value) {
            this.ensureBufferSizeToWrite(2);
            this.view.setUint16(this.pos, value);
            this.pos += 2;
        }
        writeI16(value) {
            this.ensureBufferSizeToWrite(2);
            this.view.setInt16(this.pos, value);
            this.pos += 2;
        }
        writeU32(value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setUint32(this.pos, value);
            this.pos += 4;
        }
        writeI32(value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setInt32(this.pos, value);
            this.pos += 4;
        }
        writeF32(value) {
            this.ensureBufferSizeToWrite(4);
            this.view.setFloat32(this.pos, value);
            this.pos += 4;
        }
        writeF64(value) {
            this.ensureBufferSizeToWrite(8);
            this.view.setFloat64(this.pos, value);
            this.pos += 8;
        }
        writeU64(value) {
            this.ensureBufferSizeToWrite(8);
            setUint64(this.view, this.pos, value);
            this.pos += 8;
        }
        writeI64(value) {
            this.ensureBufferSizeToWrite(8);
            setInt64(this.view, this.pos, value);
            this.pos += 8;
        }
        writeBigUint64(value) {
            this.ensureBufferSizeToWrite(8);
            this.view.setBigUint64(this.pos, value);
            this.pos += 8;
        }
        writeBigInt64(value) {
            this.ensureBufferSizeToWrite(8);
            this.view.setBigInt64(this.pos, value);
            this.pos += 8;
        }
    }

    /**
     * It encodes `value` in the MessagePack format and
     * returns a byte buffer.
     *
     * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
     */
    function encode(value, options) {
        const encoder = new Encoder(options);
        return encoder.encodeSharedRef(value);
    }

    function prettyByte(byte) {
        return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
    }

    const DEFAULT_MAX_KEY_LENGTH = 16;
    const DEFAULT_MAX_LENGTH_PER_KEY = 16;
    class CachedKeyDecoder {
        constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
            this.hit = 0;
            this.miss = 0;
            this.maxKeyLength = maxKeyLength;
            this.maxLengthPerKey = maxLengthPerKey;
            // avoid `new Array(N)`, which makes a sparse array,
            // because a sparse array is typically slower than a non-sparse array.
            this.caches = [];
            for (let i = 0; i < this.maxKeyLength; i++) {
                this.caches.push([]);
            }
        }
        canBeCached(byteLength) {
            return byteLength > 0 && byteLength <= this.maxKeyLength;
        }
        find(bytes, inputOffset, byteLength) {
            const records = this.caches[byteLength - 1];
            FIND_CHUNK: for (const record of records) {
                const recordBytes = record.bytes;
                for (let j = 0; j < byteLength; j++) {
                    if (recordBytes[j] !== bytes[inputOffset + j]) {
                        continue FIND_CHUNK;
                    }
                }
                return record.str;
            }
            return null;
        }
        store(bytes, value) {
            const records = this.caches[bytes.length - 1];
            const record = { bytes, str: value };
            if (records.length >= this.maxLengthPerKey) {
                // `records` are full!
                // Set `record` to an arbitrary position.
                records[(Math.random() * records.length) | 0] = record;
            }
            else {
                records.push(record);
            }
        }
        decode(bytes, inputOffset, byteLength) {
            const cachedValue = this.find(bytes, inputOffset, byteLength);
            if (cachedValue != null) {
                this.hit++;
                return cachedValue;
            }
            this.miss++;
            const str = utf8DecodeJs(bytes, inputOffset, byteLength);
            // Ensure to copy a slice of bytes because the bytes may be a NodeJS Buffer and Buffer#slice() returns a reference to its internal ArrayBuffer.
            const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
            this.store(slicedCopyOfBytes, str);
            return str;
        }
    }

    const STATE_ARRAY = "array";
    const STATE_MAP_KEY = "map_key";
    const STATE_MAP_VALUE = "map_value";
    const mapKeyConverter = (key) => {
        if (typeof key === "string" || typeof key === "number") {
            return key;
        }
        throw new DecodeError("The type of key must be string or number but " + typeof key);
    };
    class StackPool {
        constructor() {
            this.stack = [];
            this.stackHeadPosition = -1;
        }
        get length() {
            return this.stackHeadPosition + 1;
        }
        top() {
            return this.stack[this.stackHeadPosition];
        }
        pushArrayState(size) {
            const state = this.getUninitializedStateFromPool();
            state.type = STATE_ARRAY;
            state.position = 0;
            state.size = size;
            state.array = new Array(size);
        }
        pushMapState(size) {
            const state = this.getUninitializedStateFromPool();
            state.type = STATE_MAP_KEY;
            state.readCount = 0;
            state.size = size;
            state.map = {};
        }
        getUninitializedStateFromPool() {
            this.stackHeadPosition++;
            if (this.stackHeadPosition === this.stack.length) {
                const partialState = {
                    type: undefined,
                    size: 0,
                    array: undefined,
                    position: 0,
                    readCount: 0,
                    map: undefined,
                    key: null,
                };
                this.stack.push(partialState);
            }
            return this.stack[this.stackHeadPosition];
        }
        release(state) {
            const topStackState = this.stack[this.stackHeadPosition];
            if (topStackState !== state) {
                throw new Error("Invalid stack state. Released state is not on top of the stack.");
            }
            if (state.type === STATE_ARRAY) {
                const partialState = state;
                partialState.size = 0;
                partialState.array = undefined;
                partialState.position = 0;
                partialState.type = undefined;
            }
            if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
                const partialState = state;
                partialState.size = 0;
                partialState.map = undefined;
                partialState.readCount = 0;
                partialState.type = undefined;
            }
            this.stackHeadPosition--;
        }
        reset() {
            this.stack.length = 0;
            this.stackHeadPosition = -1;
        }
    }
    const HEAD_BYTE_REQUIRED = -1;
    const EMPTY_VIEW = new DataView(new ArrayBuffer(0));
    const EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
    try {
        // IE11: The spec says it should throw RangeError,
        // IE11: but in IE11 it throws TypeError.
        EMPTY_VIEW.getInt8(0);
    }
    catch (e) {
        if (!(e instanceof RangeError)) {
            throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
        }
    }
    const MORE_DATA = new RangeError("Insufficient data");
    const sharedCachedKeyDecoder = new CachedKeyDecoder();
    class Decoder {
        constructor(options) {
            this.totalPos = 0;
            this.pos = 0;
            this.view = EMPTY_VIEW;
            this.bytes = EMPTY_BYTES;
            this.headByte = HEAD_BYTE_REQUIRED;
            this.stack = new StackPool();
            this.entered = false;
            this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
            this.context = options?.context; // needs a type assertion because EncoderOptions has no context property when ContextType is undefined
            this.useBigInt64 = options?.useBigInt64 ?? false;
            this.rawStrings = options?.rawStrings ?? false;
            this.maxStrLength = options?.maxStrLength ?? UINT32_MAX;
            this.maxBinLength = options?.maxBinLength ?? UINT32_MAX;
            this.maxArrayLength = options?.maxArrayLength ?? UINT32_MAX;
            this.maxMapLength = options?.maxMapLength ?? UINT32_MAX;
            this.maxExtLength = options?.maxExtLength ?? UINT32_MAX;
            this.keyDecoder = options?.keyDecoder !== undefined ? options.keyDecoder : sharedCachedKeyDecoder;
            this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
        }
        clone() {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new Decoder({
                extensionCodec: this.extensionCodec,
                context: this.context,
                useBigInt64: this.useBigInt64,
                rawStrings: this.rawStrings,
                maxStrLength: this.maxStrLength,
                maxBinLength: this.maxBinLength,
                maxArrayLength: this.maxArrayLength,
                maxMapLength: this.maxMapLength,
                maxExtLength: this.maxExtLength,
                keyDecoder: this.keyDecoder,
            });
        }
        reinitializeState() {
            this.totalPos = 0;
            this.headByte = HEAD_BYTE_REQUIRED;
            this.stack.reset();
            // view, bytes, and pos will be re-initialized in setBuffer()
        }
        setBuffer(buffer) {
            const bytes = ensureUint8Array(buffer);
            this.bytes = bytes;
            this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            this.pos = 0;
        }
        appendBuffer(buffer) {
            if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
                this.setBuffer(buffer);
            }
            else {
                const remainingData = this.bytes.subarray(this.pos);
                const newData = ensureUint8Array(buffer);
                // concat remainingData + newData
                const newBuffer = new Uint8Array(remainingData.length + newData.length);
                newBuffer.set(remainingData);
                newBuffer.set(newData, remainingData.length);
                this.setBuffer(newBuffer);
            }
        }
        hasRemaining(size) {
            return this.view.byteLength - this.pos >= size;
        }
        createExtraByteError(posToShow) {
            const { view, pos } = this;
            return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
        }
        /**
         * @throws {@link DecodeError}
         * @throws {@link RangeError}
         */
        decode(buffer) {
            if (this.entered) {
                const instance = this.clone();
                return instance.decode(buffer);
            }
            try {
                this.entered = true;
                this.reinitializeState();
                this.setBuffer(buffer);
                const object = this.doDecodeSync();
                if (this.hasRemaining(1)) {
                    throw this.createExtraByteError(this.pos);
                }
                return object;
            }
            finally {
                this.entered = false;
            }
        }
        *decodeMulti(buffer) {
            if (this.entered) {
                const instance = this.clone();
                yield* instance.decodeMulti(buffer);
                return;
            }
            try {
                this.entered = true;
                this.reinitializeState();
                this.setBuffer(buffer);
                while (this.hasRemaining(1)) {
                    yield this.doDecodeSync();
                }
            }
            finally {
                this.entered = false;
            }
        }
        async decodeAsync(stream) {
            if (this.entered) {
                const instance = this.clone();
                return instance.decodeAsync(stream);
            }
            try {
                this.entered = true;
                let decoded = false;
                let object;
                for await (const buffer of stream) {
                    if (decoded) {
                        this.entered = false;
                        throw this.createExtraByteError(this.totalPos);
                    }
                    this.appendBuffer(buffer);
                    try {
                        object = this.doDecodeSync();
                        decoded = true;
                    }
                    catch (e) {
                        if (!(e instanceof RangeError)) {
                            throw e; // rethrow
                        }
                        // fallthrough
                    }
                    this.totalPos += this.pos;
                }
                if (decoded) {
                    if (this.hasRemaining(1)) {
                        throw this.createExtraByteError(this.totalPos);
                    }
                    return object;
                }
                const { headByte, pos, totalPos } = this;
                throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
            }
            finally {
                this.entered = false;
            }
        }
        decodeArrayStream(stream) {
            return this.decodeMultiAsync(stream, true);
        }
        decodeStream(stream) {
            return this.decodeMultiAsync(stream, false);
        }
        async *decodeMultiAsync(stream, isArray) {
            if (this.entered) {
                const instance = this.clone();
                yield* instance.decodeMultiAsync(stream, isArray);
                return;
            }
            try {
                this.entered = true;
                let isArrayHeaderRequired = isArray;
                let arrayItemsLeft = -1;
                for await (const buffer of stream) {
                    if (isArray && arrayItemsLeft === 0) {
                        throw this.createExtraByteError(this.totalPos);
                    }
                    this.appendBuffer(buffer);
                    if (isArrayHeaderRequired) {
                        arrayItemsLeft = this.readArraySize();
                        isArrayHeaderRequired = false;
                        this.complete();
                    }
                    try {
                        while (true) {
                            yield this.doDecodeSync();
                            if (--arrayItemsLeft === 0) {
                                break;
                            }
                        }
                    }
                    catch (e) {
                        if (!(e instanceof RangeError)) {
                            throw e; // rethrow
                        }
                        // fallthrough
                    }
                    this.totalPos += this.pos;
                }
            }
            finally {
                this.entered = false;
            }
        }
        doDecodeSync() {
            DECODE: while (true) {
                const headByte = this.readHeadByte();
                let object;
                if (headByte >= 0xe0) {
                    // negative fixint (111x xxxx) 0xe0 - 0xff
                    object = headByte - 0x100;
                }
                else if (headByte < 0xc0) {
                    if (headByte < 0x80) {
                        // positive fixint (0xxx xxxx) 0x00 - 0x7f
                        object = headByte;
                    }
                    else if (headByte < 0x90) {
                        // fixmap (1000 xxxx) 0x80 - 0x8f
                        const size = headByte - 0x80;
                        if (size !== 0) {
                            this.pushMapState(size);
                            this.complete();
                            continue DECODE;
                        }
                        else {
                            object = {};
                        }
                    }
                    else if (headByte < 0xa0) {
                        // fixarray (1001 xxxx) 0x90 - 0x9f
                        const size = headByte - 0x90;
                        if (size !== 0) {
                            this.pushArrayState(size);
                            this.complete();
                            continue DECODE;
                        }
                        else {
                            object = [];
                        }
                    }
                    else {
                        // fixstr (101x xxxx) 0xa0 - 0xbf
                        const byteLength = headByte - 0xa0;
                        object = this.decodeString(byteLength, 0);
                    }
                }
                else if (headByte === 0xc0) {
                    // nil
                    object = null;
                }
                else if (headByte === 0xc2) {
                    // false
                    object = false;
                }
                else if (headByte === 0xc3) {
                    // true
                    object = true;
                }
                else if (headByte === 0xca) {
                    // float 32
                    object = this.readF32();
                }
                else if (headByte === 0xcb) {
                    // float 64
                    object = this.readF64();
                }
                else if (headByte === 0xcc) {
                    // uint 8
                    object = this.readU8();
                }
                else if (headByte === 0xcd) {
                    // uint 16
                    object = this.readU16();
                }
                else if (headByte === 0xce) {
                    // uint 32
                    object = this.readU32();
                }
                else if (headByte === 0xcf) {
                    // uint 64
                    if (this.useBigInt64) {
                        object = this.readU64AsBigInt();
                    }
                    else {
                        object = this.readU64();
                    }
                }
                else if (headByte === 0xd0) {
                    // int 8
                    object = this.readI8();
                }
                else if (headByte === 0xd1) {
                    // int 16
                    object = this.readI16();
                }
                else if (headByte === 0xd2) {
                    // int 32
                    object = this.readI32();
                }
                else if (headByte === 0xd3) {
                    // int 64
                    if (this.useBigInt64) {
                        object = this.readI64AsBigInt();
                    }
                    else {
                        object = this.readI64();
                    }
                }
                else if (headByte === 0xd9) {
                    // str 8
                    const byteLength = this.lookU8();
                    object = this.decodeString(byteLength, 1);
                }
                else if (headByte === 0xda) {
                    // str 16
                    const byteLength = this.lookU16();
                    object = this.decodeString(byteLength, 2);
                }
                else if (headByte === 0xdb) {
                    // str 32
                    const byteLength = this.lookU32();
                    object = this.decodeString(byteLength, 4);
                }
                else if (headByte === 0xdc) {
                    // array 16
                    const size = this.readU16();
                    if (size !== 0) {
                        this.pushArrayState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = [];
                    }
                }
                else if (headByte === 0xdd) {
                    // array 32
                    const size = this.readU32();
                    if (size !== 0) {
                        this.pushArrayState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = [];
                    }
                }
                else if (headByte === 0xde) {
                    // map 16
                    const size = this.readU16();
                    if (size !== 0) {
                        this.pushMapState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = {};
                    }
                }
                else if (headByte === 0xdf) {
                    // map 32
                    const size = this.readU32();
                    if (size !== 0) {
                        this.pushMapState(size);
                        this.complete();
                        continue DECODE;
                    }
                    else {
                        object = {};
                    }
                }
                else if (headByte === 0xc4) {
                    // bin 8
                    const size = this.lookU8();
                    object = this.decodeBinary(size, 1);
                }
                else if (headByte === 0xc5) {
                    // bin 16
                    const size = this.lookU16();
                    object = this.decodeBinary(size, 2);
                }
                else if (headByte === 0xc6) {
                    // bin 32
                    const size = this.lookU32();
                    object = this.decodeBinary(size, 4);
                }
                else if (headByte === 0xd4) {
                    // fixext 1
                    object = this.decodeExtension(1, 0);
                }
                else if (headByte === 0xd5) {
                    // fixext 2
                    object = this.decodeExtension(2, 0);
                }
                else if (headByte === 0xd6) {
                    // fixext 4
                    object = this.decodeExtension(4, 0);
                }
                else if (headByte === 0xd7) {
                    // fixext 8
                    object = this.decodeExtension(8, 0);
                }
                else if (headByte === 0xd8) {
                    // fixext 16
                    object = this.decodeExtension(16, 0);
                }
                else if (headByte === 0xc7) {
                    // ext 8
                    const size = this.lookU8();
                    object = this.decodeExtension(size, 1);
                }
                else if (headByte === 0xc8) {
                    // ext 16
                    const size = this.lookU16();
                    object = this.decodeExtension(size, 2);
                }
                else if (headByte === 0xc9) {
                    // ext 32
                    const size = this.lookU32();
                    object = this.decodeExtension(size, 4);
                }
                else {
                    throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
                }
                this.complete();
                const stack = this.stack;
                while (stack.length > 0) {
                    // arrays and maps
                    const state = stack.top();
                    if (state.type === STATE_ARRAY) {
                        state.array[state.position] = object;
                        state.position++;
                        if (state.position === state.size) {
                            object = state.array;
                            stack.release(state);
                        }
                        else {
                            continue DECODE;
                        }
                    }
                    else if (state.type === STATE_MAP_KEY) {
                        if (object === "__proto__") {
                            throw new DecodeError("The key __proto__ is not allowed");
                        }
                        state.key = this.mapKeyConverter(object);
                        state.type = STATE_MAP_VALUE;
                        continue DECODE;
                    }
                    else {
                        // it must be `state.type === State.MAP_VALUE` here
                        state.map[state.key] = object;
                        state.readCount++;
                        if (state.readCount === state.size) {
                            object = state.map;
                            stack.release(state);
                        }
                        else {
                            state.key = null;
                            state.type = STATE_MAP_KEY;
                            continue DECODE;
                        }
                    }
                }
                return object;
            }
        }
        readHeadByte() {
            if (this.headByte === HEAD_BYTE_REQUIRED) {
                this.headByte = this.readU8();
                // console.log("headByte", prettyByte(this.headByte));
            }
            return this.headByte;
        }
        complete() {
            this.headByte = HEAD_BYTE_REQUIRED;
        }
        readArraySize() {
            const headByte = this.readHeadByte();
            switch (headByte) {
                case 0xdc:
                    return this.readU16();
                case 0xdd:
                    return this.readU32();
                default: {
                    if (headByte < 0xa0) {
                        return headByte - 0x90;
                    }
                    else {
                        throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
                    }
                }
            }
        }
        pushMapState(size) {
            if (size > this.maxMapLength) {
                throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
            }
            this.stack.pushMapState(size);
        }
        pushArrayState(size) {
            if (size > this.maxArrayLength) {
                throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
            }
            this.stack.pushArrayState(size);
        }
        decodeString(byteLength, headerOffset) {
            if (!this.rawStrings || this.stateIsMapKey()) {
                return this.decodeUtf8String(byteLength, headerOffset);
            }
            return this.decodeBinary(byteLength, headerOffset);
        }
        /**
         * @throws {@link RangeError}
         */
        decodeUtf8String(byteLength, headerOffset) {
            if (byteLength > this.maxStrLength) {
                throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
            }
            if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
                throw MORE_DATA;
            }
            const offset = this.pos + headerOffset;
            let object;
            if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
                object = this.keyDecoder.decode(this.bytes, offset, byteLength);
            }
            else {
                object = utf8Decode(this.bytes, offset, byteLength);
            }
            this.pos += headerOffset + byteLength;
            return object;
        }
        stateIsMapKey() {
            if (this.stack.length > 0) {
                const state = this.stack.top();
                return state.type === STATE_MAP_KEY;
            }
            return false;
        }
        /**
         * @throws {@link RangeError}
         */
        decodeBinary(byteLength, headOffset) {
            if (byteLength > this.maxBinLength) {
                throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
            }
            if (!this.hasRemaining(byteLength + headOffset)) {
                throw MORE_DATA;
            }
            const offset = this.pos + headOffset;
            const object = this.bytes.subarray(offset, offset + byteLength);
            this.pos += headOffset + byteLength;
            return object;
        }
        decodeExtension(size, headOffset) {
            if (size > this.maxExtLength) {
                throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
            }
            const extType = this.view.getInt8(this.pos + headOffset);
            const data = this.decodeBinary(size, headOffset + 1 /* extType */);
            return this.extensionCodec.decode(data, extType, this.context);
        }
        lookU8() {
            return this.view.getUint8(this.pos);
        }
        lookU16() {
            return this.view.getUint16(this.pos);
        }
        lookU32() {
            return this.view.getUint32(this.pos);
        }
        readU8() {
            const value = this.view.getUint8(this.pos);
            this.pos++;
            return value;
        }
        readI8() {
            const value = this.view.getInt8(this.pos);
            this.pos++;
            return value;
        }
        readU16() {
            const value = this.view.getUint16(this.pos);
            this.pos += 2;
            return value;
        }
        readI16() {
            const value = this.view.getInt16(this.pos);
            this.pos += 2;
            return value;
        }
        readU32() {
            const value = this.view.getUint32(this.pos);
            this.pos += 4;
            return value;
        }
        readI32() {
            const value = this.view.getInt32(this.pos);
            this.pos += 4;
            return value;
        }
        readU64() {
            const value = getUint64(this.view, this.pos);
            this.pos += 8;
            return value;
        }
        readI64() {
            const value = getInt64(this.view, this.pos);
            this.pos += 8;
            return value;
        }
        readU64AsBigInt() {
            const value = this.view.getBigUint64(this.pos);
            this.pos += 8;
            return value;
        }
        readI64AsBigInt() {
            const value = this.view.getBigInt64(this.pos);
            this.pos += 8;
            return value;
        }
        readF32() {
            const value = this.view.getFloat32(this.pos);
            this.pos += 4;
            return value;
        }
        readF64() {
            const value = this.view.getFloat64(this.pos);
            this.pos += 8;
            return value;
        }
    }

    /**
     * It decodes a single MessagePack object in a buffer.
     *
     * This is a synchronous decoding function.
     * See other variants for asynchronous decoding: {@link decodeAsync}, {@link decodeMultiStream}, or {@link decodeArrayStream}.
     *
     * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
     * @throws {@link DecodeError} if the buffer contains invalid data.
     */
    function decode(buffer, options) {
        const decoder = new Decoder(options);
        return decoder.decode(buffer);
    }

    /**
     * SmaRTC Client - Main WebRTC Client with Mesh Support
     * Handles connection, signaling, and peer management
     */
    class SmaRTCClient {
        constructor(config) {
            this.peers = new Map();
            this.eventHandlers = new Map();
            this.latencyMap = new Map();
            this.usernameMap = new Map();
            this.config = {
                maxDirectPeers: 8,
                enableMesh: true,
                canRelay: false,
                quality: 'medium',
                ...config
            };
            // Initialize SignalR connection with MessagePack protocol
            this.connection = new HubConnectionBuilder()
                .withUrl(`${config.serverUrl}/signalhub`)
                .withHubProtocol(new JsonHubProtocol()) // MessagePack would be: .withHubProtocol(new signalR.MessagePackHubProtocol())
                .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: () => 2000 // 2s retry
            })
                .configureLogging(LogLevel.Warning)
                .build();
            this.setupSignalRHandlers();
        }
        /**
         * Connect to SmaRTC server and join session
         */
        async connect(localStream) {
            this.localStream = localStream;
            try {
                await this.connection.start();
                console.log('✅ Connected to SmaRTC server');
                // Join session
                await this.connection.invoke('JoinSession', this.config.sessionId, this.config.username);
                // Set relay capability if enabled
                if (this.config.canRelay) {
                    await this.connection.invoke('SetRelayCapability', true);
                }
                this.emit('connected');
                this.startHeartbeat();
            }
            catch (error) {
                console.error('❌ Connection failed:', error);
                this.emit('error', error);
                throw error;
            }
        }
        /**
         * Disconnect from server and close all peer connections
         */
        async disconnect() {
            // Leave session
            if (this.connection.state === HubConnectionState.Connected) {
                await this.connection.invoke('LeaveSession', this.config.sessionId);
            }
            // Close all peer connections
            this.peers.forEach(peer => {
                peer.connection.close();
            });
            this.peers.clear();
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
            }
            // Disconnect SignalR
            await this.connection.stop();
            this.emit('disconnected');
        }
        /**
         * Create peer connection for direct communication
         */
        async createPeerConnection(peerId) {
            const config = {
                iceServers: this.config.iceServers || [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };
            const pc = new RTCPeerConnection(config);
            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                });
            }
            // Handle remote stream
            pc.ontrack = (event) => {
                const username = this.usernameMap.get(peerId) || 'Unknown User';
                console.log('📹 Received remote stream from:', username);
                this.emit('remote-stream', peerId, event.streams[0], username);
            };
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendSignal(peerId, {
                        type: 'ice-candidate',
                        from: this.config.username,
                        to: peerId,
                        data: event.candidate
                    });
                }
            };
            // Connection state monitoring
            pc.onconnectionstatechange = () => {
                console.log(`Peer ${peerId} connection state:`, pc.connectionState);
                if (pc.connectionState === 'connected') {
                    this.measureLatency(peerId);
                }
                else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    this.peers.delete(peerId);
                }
            };
            // Create data channel for signaling
            const dataChannel = pc.createDataChannel('smartc-signals', {
                ordered: true,
                maxRetransmits: 3
            });
            this.setupDataChannel(peerId, dataChannel);
            // Store peer connection
            this.peers.set(peerId, {
                peerId,
                connection: pc,
                dataChannel,
                latency: 999,
                isRelay: false
            });
            return pc;
        }
        /**
         * Create and send WebRTC offer
         */
        async createOffer(peerId) {
            const pc = await this.createPeerConnection(peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.sendSignal(peerId, {
                type: 'offer',
                from: this.config.username,
                to: peerId,
                data: offer
            });
        }
        /**
         * Handle incoming WebRTC offer
         */
        async handleOffer(peerId, offer) {
            const pc = await this.createPeerConnection(peerId);
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.sendSignal(peerId, {
                type: 'answer',
                from: this.config.username,
                to: peerId,
                data: answer
            });
        }
        /**
         * Handle incoming WebRTC answer
         */
        async handleAnswer(peerId, answer) {
            const peer = this.peers.get(peerId);
            if (peer) {
                // Only set remote description if we're in the correct state
                if (peer.connection.signalingState === 'have-local-offer') {
                    await peer.connection.setRemoteDescription(answer);
                    console.log('✅ Answer set for peer:', peerId);
                }
                else {
                    console.warn('⚠️ Ignoring answer in wrong state:', peer.connection.signalingState);
                }
            }
        }
        /**
         * Handle incoming ICE candidate
         */
        async handleIceCandidate(peerId, candidate) {
            const peer = this.peers.get(peerId);
            if (peer) {
                await peer.connection.addIceCandidate(candidate);
            }
        }
        /**
         * Send signal through SignalR (fallback) or DataChannel (preferred)
         */
        async sendSignal(targetPeerId, signal) {
            const peer = this.peers.get(targetPeerId);
            // Try to send via DataChannel first (zero server cost!)
            if (peer?.dataChannel?.readyState === 'open') {
                const encoded = encode(signal);
                peer.dataChannel.send(encoded);
                return;
            }
            // Fallback to SignalR
            await this.connection.invoke('SendSignal', targetPeerId, JSON.stringify(signal));
        }
        /**
         * Setup SignalR event handlers
         */
        setupSignalRHandlers() {
            // User joined session
            this.connection.on('UserJoined', (data) => {
                console.log('👤 User joined:', data.username);
                // Store username for this peer
                this.usernameMap.set(data.connectionId, data.username);
                this.emit('peer-joined', data.connectionId, data.username);
                // Initiate peer connection if under direct peer limit
                // Only initiate if our connectionId is "smaller" to avoid duplicate connections
                if (this.peers.size < (this.config.maxDirectPeers || 8)) {
                    const myId = this.connection.connectionId || '';
                    if (myId < data.connectionId) {
                        console.log('🔄 Initiating offer to:', data.connectionId);
                        this.createOffer(data.connectionId);
                    }
                    else {
                        console.log('⏳ Waiting for offer from:', data.connectionId);
                    }
                }
            });
            // User left session
            this.connection.on('UserLeft', (data) => {
                console.log('👋 User left:', data.username);
                const peer = this.peers.get(data.connectionId);
                if (peer) {
                    peer.connection.close();
                    this.peers.delete(data.connectionId);
                }
                this.usernameMap.delete(data.connectionId);
                this.emit('peer-left', data.connectionId);
            });
            // Receive WebRTC signal
            this.connection.on('ReceiveSignal', async (fromPeer, signal) => {
                const signalData = typeof signal === 'string' ? JSON.parse(signal) : signal;
                switch (signalData.type) {
                    case 'offer':
                        await this.handleOffer(fromPeer, signalData.data);
                        break;
                    case 'answer':
                        await this.handleAnswer(fromPeer, signalData.data);
                        break;
                    case 'ice-candidate':
                        await this.handleIceCandidate(fromPeer, signalData.data);
                        break;
                }
            });
            // Mesh topology update
            this.connection.on('MeshUpdate', (topology) => {
                console.log('🕸️ Mesh topology updated:', topology);
                this.emit('mesh-update', topology);
            });
            // Relay promotion
            this.connection.on('RelayPromotion', (isRelay) => {
                console.log('🎖️ Relay status:', isRelay ? 'PROMOTED' : 'DEMOTED');
                this.emit('relay-promotion', isRelay);
            });
        }
        /**
         * Setup data channel for P2P signaling
         */
        setupDataChannel(peerId, channel) {
            channel.onopen = () => {
                console.log('📡 Data channel opened with:', peerId);
            };
            channel.onmessage = (event) => {
                try {
                    const signal = decode(new Uint8Array(event.data));
                    // Handle P2P signal without server
                    this.handleP2PSignal(peerId, signal);
                }
                catch (error) {
                    console.error('Failed to decode P2P signal:', error);
                }
            };
            channel.onerror = (error) => {
                console.error('Data channel error:', error);
            };
        }
        /**
         * Handle P2P signal received via data channel
         */
        async handleP2PSignal(fromPeer, signal) {
            // Forward to appropriate handler
            switch (signal.type) {
                case 'relay':
                    // Handle relay forwarding
                    const targetPeer = this.peers.get(signal.to);
                    if (targetPeer?.dataChannel?.readyState === 'open') {
                        const encoded = encode(signal);
                        targetPeer.dataChannel.send(encoded);
                    }
                    break;
            }
        }
        /**
         * Measure latency to peer
         */
        async measureLatency(peerId) {
            const peer = this.peers.get(peerId);
            if (!peer?.connection)
                return;
            try {
                const stats = await peer.connection.getStats();
                stats.forEach((report) => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        const rtt = report.currentRoundTripTime * 1000; // Convert to ms
                        peer.latency = rtt;
                        this.latencyMap.set(peerId, rtt);
                        // Report latency to server for mesh optimization
                        this.connection.invoke('UpdatePeerLatency', peerId, Math.round(rtt));
                    }
                });
            }
            catch (error) {
                console.error('Failed to measure latency:', error);
            }
        }
        /**
         * Start heartbeat to keep connection alive
         */
        startHeartbeat() {
            setInterval(() => {
                if (this.connection.state === HubConnectionState.Connected) {
                    this.connection.invoke('Heartbeat').catch(() => {
                        console.warn('Heartbeat failed');
                    });
                }
            }, 30000); // Every 30 seconds
        }
        /**
         * Get session information
         */
        getSessionInfo() {
            return this.sessionInfo;
        }
        /**
         * Get connected peers
         */
        getPeers() {
            return Array.from(this.peers.values());
        }
        /**
         * Send custom message to specific peer via data channel
         */
        sendMessage(peerId, data) {
            const peer = this.peers.get(peerId);
            if (peer?.dataChannel?.readyState === 'open') {
                const message = { type: 'custom-message', data };
                peer.dataChannel.send(JSON.stringify(message));
            }
            else {
                console.warn(`Cannot send message to ${peerId}: no open data channel`);
            }
        }
        /**
         * Broadcast message to all connected peers
         */
        broadcast(data) {
            this.peers.forEach((peer, peerId) => {
                this.sendMessage(peerId, data);
            });
        }
        /**
         * Get WebRTC stats for a specific peer
         */
        async getStats(peerId) {
            if (!peerId) {
                // Return aggregated stats for all peers
                const allStats = [];
                for (const [id, peer] of this.peers) {
                    const stats = await peer.connection.getStats();
                    allStats.push({ peerId: id, stats });
                }
                return allStats;
            }
            const peer = this.peers.get(peerId);
            if (!peer)
                return null;
            const stats = await peer.connection.getStats();
            const result = { latency: peer.latency, bitrate: 0, packetsLost: 0 };
            stats.forEach((report) => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    result.bitrate = Math.round((report.bytesReceived * 8) / 1000); // kbps
                    result.packetsLost = report.packetsLost || 0;
                    result.jitter = report.jitter || 0;
                }
            });
            return result;
        }
        /**
         * Change video quality dynamically
         */
        setQuality(quality) {
            this.config.quality = quality;
            // Note: In production, this should trigger renegotiation
            console.log(`Quality changed to: ${quality}`);
        }
        /**
         * Event emitter helpers
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }
        off(event, handler) {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }
        emit(event, ...args) {
            const handlers = this.eventHandlers.get(event);
            if (handlers) {
                handlers.forEach(handler => handler(...args));
            }
        }
    }

    /**
     * Adaptive Mesh Network Client
     * Handles intelligent peer routing and relay management
     */
    class AdaptiveMeshClient extends SmaRTCClient {
        constructor(config) {
            super({ ...config, enableMesh: true });
            this.routingStrategy = 'fullMesh';
            this.relayNodes = new Set();
            this.directPeers = new Set();
            this.setupMeshHandlers();
        }
        /**
         * Setup mesh-specific event handlers
         */
        setupMeshHandlers() {
            this.on('mesh-update', (topology) => {
                this.routingStrategy = topology.strategy;
                this.relayNodes = new Set(topology.relayNodes);
                this.directPeers = new Set(topology.directPeers);
                console.log('🕸️ Mesh updated:', {
                    strategy: this.routingStrategy,
                    directPeers: this.directPeers.size,
                    relayNodes: this.relayNodes.size
                });
                this.optimizeConnections();
            });
        }
        /**
         * Optimize peer connections based on mesh topology
         */
        async optimizeConnections() {
            const currentPeers = this.getPeers();
            // Close connections not in direct peers list (if using relay strategy)
            if (this.routingStrategy === 'relayBased') {
                currentPeers.forEach(peer => {
                    if (!this.directPeers.has(peer.peerId) && !this.relayNodes.has(peer.peerId)) {
                        peer.connection.close();
                    }
                });
            }
            // Ensure connections to relay nodes
            this.relayNodes.forEach(async (relayId) => {
                const existingPeer = currentPeers.find(p => p.peerId === relayId);
                if (!existingPeer) {
                    await this.createOffer(relayId);
                }
            });
        }
        /**
         * Get optimal routing path for a message
         */
        getRoutingPath(targetPeerId) {
            const peers = this.getPeers();
            const directPeer = peers.find(p => p.peerId === targetPeerId);
            if (directPeer) {
                // Direct connection available
                return [targetPeerId];
            }
            // Route through relay
            const relayPeers = peers.filter(p => this.relayNodes.has(p.peerId));
            if (relayPeers.length > 0) {
                // Choose relay with lowest latency
                const bestRelay = relayPeers.reduce((best, current) => current.latency < best.latency ? current : best);
                return [bestRelay.peerId, targetPeerId];
            }
            // No route available (fallback to server)
            return [];
        }
        /**
         * Get current mesh statistics
         */
        getMeshStats() {
            const peers = this.getPeers();
            return {
                strategy: this.routingStrategy,
                totalPeers: peers.length,
                directPeers: Array.from(this.directPeers).length,
                relayNodes: Array.from(this.relayNodes).length,
                averageLatency: peers.reduce((sum, p) => sum + p.latency, 0) / peers.length,
                minLatency: Math.min(...peers.map(p => p.latency)),
                maxLatency: Math.max(...peers.map(p => p.latency))
            };
        }
    }

    /**
     * Differential Video Decoder (Client-Side)
     * Decodes compressed video frames from SmaRTC server
     */
    class DifferentialVideoDecoder {
        constructor(width, height) {
            this.previousFrame = null;
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx = this.canvas.getContext('2d');
        }
        /**
         * Decode compressed frame
         */
        decode(compressedData) {
            const isKeyframe = compressedData[0] === 0xFF;
            if (isKeyframe) {
                return this.decodeKeyframe(compressedData);
            }
            else {
                return this.decodeDeltaFrame(compressedData);
            }
        }
        /**
         * Decode keyframe (full frame)
         */
        decodeKeyframe(data) {
            // Placeholder: In production, implement full decompression
            const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            // Simple RLE decompression (matches server encoder)
            let dataIndex = 2; // Skip header
            let pixelIndex = 0;
            while (dataIndex < data.length && pixelIndex < imageData.data.length) {
                if (data[dataIndex] === 0xFF) {
                    // RLE marker
                    const count = data[dataIndex + 1];
                    const value = data[dataIndex + 2];
                    for (let i = 0; i < count; i++) {
                        imageData.data[pixelIndex++] = value;
                    }
                    dataIndex += 3;
                }
                else {
                    // Literal
                    imageData.data[pixelIndex++] = data[dataIndex++];
                }
            }
            this.previousFrame = imageData;
            return imageData;
        }
        /**
         * Decode delta frame (only changes)
         */
        decodeDeltaFrame(data) {
            if (!this.previousFrame) {
                throw new Error('No previous frame for delta decoding');
            }
            // Clone previous frame
            const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            imageData.data.set(this.previousFrame.data);
            // Apply delta changes
            let dataIndex = 1; // Skip header
            const changedBlocks = (data[dataIndex] | (data[dataIndex + 1] << 8));
            dataIndex += 2;
            // Decode each changed block
            for (let i = 0; i < changedBlocks; i++) {
                const blockX = data[dataIndex++];
                const blockY = data[dataIndex++];
                // Decode block data (simplified)
                // In production: implement full block decode with dequantization
                const blockSize = 8;
                (blockY * blockSize * this.canvas.width + blockX * blockSize) * 4;
                // Read compressed block data
                // ... (implementation details)
            }
            this.previousFrame = imageData;
            return imageData;
        }
        /**
         * Get decoded frame as canvas element
         */
        getCanvas() {
            return this.canvas;
        }
        /**
         * Render decoded frame to target canvas
         */
        renderTo(targetCanvas) {
            const targetCtx = targetCanvas.getContext('2d');
            targetCtx.drawImage(this.canvas, 0, 0, targetCanvas.width, targetCanvas.height);
        }
    }

    /**
     * SmaRTC Easy API - Simplified wrapper for quick integration
     * Zero boilerplate, maximum productivity
     */
    /**
     * Easy API - Simplified SmaRTC client
     * Perfect for quick prototypes and simple use cases
     */
    class SmaRTCEasy {
        constructor(config, callbacks = {}) {
            this.config = {
                userName: `User-${Math.random().toString(36).substr(2, 5)}`,
                videoQuality: 'medium',
                audioOnly: false,
                autoJoin: false,
                ...config
            };
            this.callbacks = callbacks;
            // Create underlying client
            const clientConfig = {
                serverUrl: this.config.serverUrl,
                sessionId: this.config.roomId,
                username: this.config.userName,
                quality: this.config.videoQuality, // Type conversion for enum
                enableMesh: true,
                maxDirectPeers: 8
            };
            this.client = new SmaRTCClient(clientConfig);
            this.setupEventHandlers();
            // Auto-join if requested
            if (this.config.autoJoin) {
                this.join().catch(error => {
                    console.error('Auto-join failed:', error);
                    callbacks.onError?.(error);
                });
            }
        }
        /**
         * Join the room (starts camera/mic and connects)
         */
        async join() {
            try {
                // Get media
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: !this.config.audioOnly ? {
                        width: { ideal: this.getVideoWidth() },
                        height: { ideal: this.getVideoHeight() }
                    } : false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                // Connect
                await this.client.connect(this.localStream);
            }
            catch (error) {
                console.error('Failed to join:', error);
                this.callbacks.onError?.(error);
                throw error;
            }
        }
        /**
         * Leave the room (disconnects and stops camera/mic)
         */
        async leave() {
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = undefined;
            }
            await this.client.disconnect();
        }
        /**
         * Get local media stream
         */
        getLocalStream() {
            return this.localStream;
        }
        /**
         * Toggle video on/off
         */
        toggleVideo(enabled) {
            if (!this.localStream)
                return false;
            const videoTracks = this.localStream.getVideoTracks();
            if (videoTracks.length === 0)
                return false;
            const newState = enabled ?? !videoTracks[0].enabled;
            videoTracks.forEach(track => track.enabled = newState);
            return newState;
        }
        /**
         * Toggle audio on/off
         */
        toggleAudio(enabled) {
            if (!this.localStream)
                return false;
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length === 0)
                return false;
            const newState = enabled ?? !audioTracks[0].enabled;
            audioTracks.forEach(track => track.enabled = newState);
            return newState;
        }
        /**
         * Change video quality
         */
        setQuality(quality) {
            this.config.videoQuality = quality;
            // Note: Quality change requires re-negotiation in real implementation
            console.warn('Quality change will take effect on next session');
        }
        /**
         * Get list of connected peers
         */
        getPeers() {
            return this.client.getPeers().map(peer => ({
                id: peer.peerId,
                latency: peer.latency
            }));
        }
        /**
         * Get room statistics
         */
        getRoomStats() {
            const sessionInfo = this.client.getSessionInfo();
            const peers = this.client.getPeers();
            return {
                totalPeers: peers.length,
                directConnections: peers.filter(p => !p.isRelay).length,
                relayedConnections: peers.filter(p => p.isRelay).length,
                meshStrategy: sessionInfo?.meshStrategy
            };
        }
        /**
         * Send custom message to specific peer
         */
        sendMessageToPeer(peerId, message) {
            this.client.sendMessage(peerId, message);
        }
        /**
         * Broadcast message to all peers
         */
        broadcast(message) {
            this.client.broadcast(message);
        }
        /**
         * Listen for custom messages
         */
        onMessage(callback) {
            this.client.on('message', callback);
        }
        // Private methods
        setupEventHandlers() {
            this.client.on('connected', () => {
                this.callbacks.onReady?.();
            });
            this.client.on('peer-joined', (peerId) => {
                this.callbacks.onPeerJoined?.(peerId);
            });
            this.client.on('peer-left', (peerId) => {
                this.callbacks.onPeerLeft?.(peerId);
            });
            this.client.on('remote-stream', (peerId, stream) => {
                this.callbacks.onRemoteStream?.(peerId, stream);
            });
            this.client.on('error', (error) => {
                this.callbacks.onError?.(error);
            });
            this.client.on('disconnected', () => {
                this.callbacks.onDisconnected?.();
            });
        }
        getVideoWidth() {
            switch (this.config.videoQuality) {
                case 'low': return 640;
                case 'medium': return 1280;
                case 'high': return 1920;
                default: return 1280;
            }
        }
        getVideoHeight() {
            switch (this.config.videoQuality) {
                case 'low': return 480;
                case 'medium': return 720;
                case 'high': return 1080;
                default: return 720;
            }
        }
    }
    /**
     * Quick helper function for ultra-simple integration
     *
     * @example
     * const room = await quickJoin('http://localhost:5000', 'my-room', {
     *   onRemoteStream: (peerId, stream) => {
     *     // Display remote video
     *   }
     * });
     */
    async function quickJoin(serverUrl, roomId, callbacks = {}) {
        const client = new SmaRTCEasy({ serverUrl, roomId, autoJoin: false }, callbacks);
        await client.join();
        return client;
    }

    /**
     * Type definitions for SmaRTC Zero-Cost SDK
     */
    exports.QualityLevel = void 0;
    (function (QualityLevel) {
        QualityLevel["VeryLow"] = "veryLow";
        QualityLevel["Low"] = "low";
        QualityLevel["Medium"] = "medium";
        QualityLevel["High"] = "high";
        QualityLevel["VeryHigh"] = "veryHigh"; // 720p, ~800kbps
    })(exports.QualityLevel || (exports.QualityLevel = {}));
    exports.RoutingStrategy = void 0;
    (function (RoutingStrategy) {
        RoutingStrategy["FullMesh"] = "fullMesh";
        RoutingStrategy["Hybrid"] = "hybrid";
        RoutingStrategy["RelayBased"] = "relayBased";
    })(exports.RoutingStrategy || (exports.RoutingStrategy = {}));

    /**
     * Utility functions for SmaRTC Client
     */
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    function calculateBandwidth(bytes, durationMs) {
        return (bytes * 8) / (durationMs / 1000); // bits per second
    }
    function formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    function debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout)
                clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    function throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    exports.AdaptiveMeshClient = AdaptiveMeshClient;
    exports.DifferentialVideoDecoder = DifferentialVideoDecoder;
    exports.SmaRTCClient = SmaRTCClient;
    exports.SmaRTCEasy = SmaRTCEasy;
    exports.calculateBandwidth = calculateBandwidth;
    exports.debounce = debounce;
    exports.formatBytes = formatBytes;
    exports.generateId = generateId;
    exports.quickJoin = quickJoin;
    exports.throttle = throttle;

    return exports;

})({});
//# sourceMappingURL=smartc-browser.js.map
