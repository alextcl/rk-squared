import * as cheerio from 'cheerio';
import * as connect from 'connect';
import * as fs from 'fs';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as moment from 'moment';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as url from 'url';
import * as zlib from 'zlib';

import { Store } from 'redux';

const transformerProxy = require('transformer-proxy');

import battle from './battle';
import options from './options';

import { IState } from '../reducers';

const handlers = {
  battle,
  options,
};

// FIXME: Proper logging library
// tslint:disable no-console

function isFfrkApiRequest(req: http.IncomingMessage) {
  return req.headers['accept']
      && req.headers['accept']!.indexOf('application/json') !== -1
      && req.headers['x-requested-with'] === 'XMLHttpRequest';
}

function isFfrkStartupRequest(req: http.IncomingMessage) {
  return req.url === 'http://ffrk.denagames.com/dff/'
      && req.headers['accept']
      && req.headers['accept']!.indexOf('text/html') !== -1;
}

/**
 * Returns a list of IP addresses, in string form.  Based on
 * https://stackoverflow.com/a/8440736/25507.
 */
function getIpAddresses() {
  const interfaces = os.networkInterfaces();
  const result: string[] = [];

  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if ('IPv4' !== iface.family || iface.internal) {
        // skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
        return;
      }

      result.push(iface.address);
    });
  });

  return result;
}

function decodeData(data: Buffer, res: http.ServerResponse) {
  if (res.getHeader('content-encoding')) {
    return zlib.gunzipSync(data);
  } else {
    return data;
  }
}

function encodeData(data: string, res: http.ServerResponse) {
  if (res.getHeader('content-encoding')) {
    return zlib.gzipSync(data);
  } else {
    return Buffer.from(data);
  }
}

const capturePath = path.join(__dirname, 'captures');
if (!fs.existsSync(capturePath)) {
  fs.mkdirSync(capturePath);
}

function getCaptureFilename(req: http.IncomingMessage) {
  if (req.url == null) {
    throw new Error('No URL included in request');
  }
  const datestamp = moment().format('YYYY-MM-DD-HH-mm-ss-SSS');
  const urlPath = url.parse(req.url).pathname!.replace(/\//g, '_');
  return path.join(capturePath, datestamp + urlPath + '.json');
}

function recordCapturedData(rawData: string, data: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const filename = getCaptureFilename(req);
  const { url, method, headers } = req;  // tslint:disable-line no-shadowed-variable
  const response = { headers: res.getHeaders() };

  // FIXME: Logging
  fs.writeFile(filename + '.raw', rawData, err => {});

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify({ url, method, headers, response, data }, null, 2), err => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

const UTF8_BOM = 0xFEFF;

function extractJson($el: Cheerio) {
  const rawJson = $el.html();
  if (rawJson == null) {
    throw new Error('Failed to find data');
  } else {
    return JSON.parse(rawJson);
  }
}

function checkHandlers(data: {}, req: http.IncomingMessage, res: http.ServerResponse, store: Store<IState>) {
  const fragment = path.posix.basename(url.parse(req.url as string).pathname as string);
  let changed = false;
  Object.keys(handlers).forEach(k => {
    // FIXME: Type signatures for handlers - and/or replace with EventEmitter
    if ((handlers as any)[k][fragment]) {
      const newData = (handlers as any)[k][fragment](data, store);
      if (newData !== undefined) {
        changed = true;
        data = newData;
      }
    }
  });
  return changed ? data : undefined;
}

function handleFfrkApiRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>
) {
  try {
    const rawData = decodeData(data, res).toString();
    let decoded = rawData;
    if (decoded.charCodeAt(0) === UTF8_BOM) {
      decoded = decoded.substr(1);
    }
    decoded = JSON.parse(decoded);

    recordCapturedData(rawData, decoded, req, res)
      .catch(err => console.error(`Failed to save data capture: ${err}`))
      .then(filename => console.log(`Saved to ${filename}`));

    const newData = checkHandlers(decoded, req, res, store);
    if (newData !== undefined) {
      data = encodeData(String.fromCharCode(UTF8_BOM) + JSON.stringify(newData), res);
    }
  } catch (error) {
    console.error(error);
  }
  return data;
}

function handleFfrkStartupRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>
) {
  try {
    const rawData = decodeData(data, res).toString();
    const $ = cheerio.load(rawData);

    const appInitData = extractJson($('script[data-app-init-data]'));
    const textMaster = extractJson($('#text-master'));
    const startupData = { appInitData, textMaster };
    recordCapturedData(rawData, startupData, req, res)
      .catch(err => console.error(`Failed to save data capture: ${err}`))
      .then(filename => console.log(`Saved to ${filename}`));

    checkHandlers(startupData, req, res, store);
  } catch (error) {
    console.error(error);
  }
  return data;
}

export function createFfrkProxy(store: Store<IState>) {
  function transformerFunction(data: Buffer, req: http.IncomingMessage, res: http.ServerResponse) {
    if (isFfrkApiRequest(req)) {
      return handleFfrkApiRequest(data, req, res, store);
    } else if (isFfrkStartupRequest(req)) {
      return handleFfrkStartupRequest(data, req, res, store);
    } else {
      return data;
    }
  }

  const proxy = httpProxy.createProxyServer({});
  proxy.on('error', e => console.log(e));

  const app = connect();

  app.use(transformerProxy(transformerFunction, {match: /ffrk.denagames.com\/dff/, headers: [{ name: 'ff-chk', value: null}]}));

  app.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    console.log(req.url);
    // console.log(req.headers);
    next();
  });

  app.use((req: http.IncomingMessage, res: http.ServerResponse) => proxy.web(req, res, {
    target: `http://${req.headers.host}/`
  }));

  const server = http.createServer(app);

  server.on('error', e => console.log(e));

  // Proxy HTTP requests.  For more information:
  // https://nodejs.org/api/http.html#http_event_connect
  server.on('connect', (req, cltSocket, head) => {
    console.log(`CONNECT ${req.url}`);
    // console.log(req.headers);
    const srvUrl = url.parse(`https://${req.url}`);
    const srvPort = +(srvUrl.port || 80);
    const srvSocket = net.connect(srvPort, srvUrl.hostname, () => {
      cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n');
      srvSocket.write(head);
      srvSocket.pipe(cltSocket);
      cltSocket.pipe(srvSocket);
    });
  });

  const port = 8888;
  const addresses = getIpAddresses().join(',');
  console.log(`Listening on ${addresses}, port ${port}`);
  server.listen(port);
}
