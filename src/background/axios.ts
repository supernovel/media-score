import axios, {
  AxiosError,
  AxiosResponse,
  CustomParamsSerializer,
  InternalAxiosRequestConfig,
  ParamsSerializerOptions,
} from 'axios';
import qs from 'qs';

export default axios.create({
  adapter: fetchAdapter,
});

/**
 * - Create a request object
 * - Get response body
 * - Check if timeout
 */
async function fetchAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const request = createRequest(config);
  const promiseChain = [getResponse(request, config)];

  if (config.timeout && config.timeout > 0) {
    promiseChain.push(
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const message = config.timeoutErrorMessage
            ? config.timeoutErrorMessage
            : 'timeout of ' + config.timeout + 'ms exceeded';
          reject(
            new axios.AxiosError(message, 'ECONNABORTED', config, request),
          );
        }, config.timeout);
      }),
    );
  }

  const data = await Promise.race(promiseChain);
  return new Promise((resolve, reject) => {
    if (data instanceof Error) {
      reject(data);
    } else {
      settle(resolve, reject, data);
    }
  });
}

/**
 * Fetch API stage two is to get response body. This funtion tries to retrieve
 * response body based on response's type
 */
async function getResponse(
  request,
  config,
): Promise<AxiosResponse<unknown, unknown>> {
  let stageOne;
  try {
    stageOne = await fetch(request);
  } catch (e) {
    throw new axios.AxiosError('Network Error', 'ERR_NETWORK', config, request);
  }

  const response: AxiosResponse<unknown, unknown> = {
    status: stageOne.status,
    statusText: stageOne.statusText,
    headers: stageOne.headers,
    config: config,
    request,
    data: undefined,
  };

  if (stageOne.status >= 200 && stageOne.status !== 204) {
    switch (config.responseType) {
      case 'arraybuffer':
        response.data = await stageOne.arrayBuffer();
        break;
      case 'blob':
        response.data = await stageOne.blob();
        break;
      case 'json':
        response.data = await stageOne.json();
        break;
      case 'formData':
        response.data = await stageOne.formData();
        break;
      default:
        response.data = await stageOne.text();
        break;
    }
  }

  return response;
}

/**
 * This function will create a Request object based on configuration's axios
 */
function createRequest(config: InternalAxiosRequestConfig): Request {
  const headers = new Headers(config.headers);

  // HTTP basic authentication
  if (config.auth) {
    const username = config.auth.username || '';
    const password = config.auth.password
      ? decodeURI(encodeURIComponent(config.auth.password))
      : '';
    headers.set('Authorization', `Basic ${btoa(username + ':' + password)}`);
  }

  const method = config.method?.toUpperCase() ?? 'GET';
  const options = {
    headers: headers,
    method,
  } as RequestInit;

  if (method !== 'GET' && method !== 'HEAD') {
    options.body = config.data;
  }

  const fullPath = buildFullPath(config.baseURL ?? '', config.url ?? '');
  const url = buildURL(fullPath, config.params, config.paramsSerializer);

  // Expected browser to throw error if there is any wrong configuration value
  return new Request(url, options);
}

function settle(resolve, reject, response: AxiosResponse<unknown, unknown>) {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(
      new AxiosError(
        'Request failed with status code ' + response.status,
        [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][
          Math.floor(response.status / 100) - 4
        ],
        response.config,
        response.request,
        response,
      ),
    );
  }
}

function buildFullPath(baseURL: string, requestedURL: string) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

function combineURLs(baseURL: string, relativeURL: string) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

function isAbsoluteURL(url: string) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

function buildURL(
  url: string,
  params: object,
  options?: ParamsSerializerOptions | CustomParamsSerializer,
) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  const serializeFn = options && options['serialize'];

  const serializedParams =
    serializeFn == null ? qs.stringify(params) : serializeFn(params, options);

  if (serializedParams) {
    const hashmarkIndex = url.indexOf('#');

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
}
