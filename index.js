var http = require("http");
// const request = require('request');
const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// Load the .env file if it exists
require("dotenv").config();
const {
  ContainerClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.raw());
// add timestamps in front of log messages
require("console-stamp")(console, "yy-mm-dd,HH:MM:ss.l");
// since logger only returns a UTC version of date, I'm defining my own date format - using an internal module from console-stamp
// express.logger.format('mydate', function() {
//     var df = require('console-stamp/node_modules/dateformat');
//     return df(new Date(), 'YYYY-mm-DD,HH:MM:ss.l');
// });
// app.use(express.logger('[:mydate] :method :url :status :res[content-length] - :remote-addr - :response-time ms'));

// Remove the X-Powered-By headers.
const removeThoseHeaders = [
  "x-powered-by",
  "set-cookie",
  "x-request-id",
  "x-frame-options",
  "access-control-allow-origin",
  "x-xss-protection",
  "x-content-type-options",
  "referrer-policy",
  "content-security-policy",
  "strict-transport-security",
  "cf-cache-status",
];

// GENERIC GET to have a feedback...
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST request to get forward params to third party services
app.post("/proxyreq", (req, res, next) => {
  console.log("proxyreq");
  console.log("req.body['uri']: ", req.body["uri"]);
  console.log("req.body['method']: ", req.body["method"]);
  console.log("req.body['body']: ", req.body["body"]);
  console.log("req.body['json']: ", req.body["json"]);
  console.log("req.body['headers']: ", req.body["headers"]);
  let headersReq = {
    "Content-Type": "application/json",
    Range: " bytes=0-1499",
  };
  if (req.body["headers"] !== null) {
    headersReq = req.body["headers"];
  }
  const bodyReq = req.body["body"];
  if (bodyReq === undefined) {
    bodyReq = null;
  }
  const contenttype = null;
  if (req.body["json"] === true) {
    contenttype = "application/json";
  }
  fetch(req.body["uri"], {
    method: req.body["method"],
    body: bodyReq,
    headers: headersReq,
  })
    .then((res) => {
      console.log(`Request result status: ${res.status}`);
      res.json();
    })
    .then((json) => {
      console.log(json);
      res.json(json);
    });
});

// GET request to read pictures from blob storage
app.get("/picture/:filename", async (req, res) => {
  const blobFileName = req.params.filename;
  console.log(`GET picture filename: ${blobFileName}`);

  const account = process.env.ACCOUNT_NAME || "";
  const accountKey = process.env.ACCOUNT_KEY || "";
  const containerName = process.env.CONTAINER_NAME || "";
  // Use StorageSharedKeyCredential with storage account and account key
  // StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey
  );

  // Create a container
  const containerClient = new ContainerClient(
    `https://${account}.blob.core.windows.net/${containerName}`,
    sharedKeyCredential
  );

  // Downloading blob from the snapshot
  const blobName = blobFileName;
  const blobClient = containerClient.getBlobClient(blobName);
  // const blockBlobClient = blobClient.getBlockBlobClient();
  console.log("Downloading blob...");
  const snapshotResponse = await blobClient.createSnapshot();
  const blobSnapshotClient = blobClient.withSnapshot(snapshotResponse.snapshot);

  const response = await blobSnapshotClient.download(0);
  console.log(
    `Reading response length ${
      (await blobSnapshotClient.getProperties()).contentLength
    }`
  );
  // console.log(
  //   "Downloaded blob content",
  //   (await streamToBuffer(response.readableStreamBody)).toString()
  // );
  res.send(await streamToBuffer(response.readableStreamBody));
});

// POST Request to store a new picture to blob storage
app.post("/picture/:filename", bodyParser.raw(), async (req, res, next) => {
  const blobFileName = req.params.filename;
  console.log(`POST picture filename: ${blobFileName}`);

  const account = process.env.ACCOUNT_NAME || "";
  const accountKey = process.env.ACCOUNT_KEY || "";
  const containerName = process.env.CONTAINER_NAME || "";
  // Use StorageSharedKeyCredential with storage account and account key
  // StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey
  );

  // Create a container
  const containerClient = new ContainerClient(
    `https://${account}.blob.core.windows.net/${containerName}`,
    sharedKeyCredential
  );

  // Downloading blob from the snapshot
  const blobName = blobFileName;
  const blobClient = containerClient.getBlobClient(blobName);
  const blockBlobClient = blobClient.getBlockBlobClient();

  // console.log('req body ', req.body);
  const content = req.body;
  const uploadBlobResponse = await blockBlobClient.upload(
    content,
    Buffer.byteLength(content)
  );
  console.log(
    `Uploaded block blob ${blobName} successfully`,
    uploadBlobResponse.requestId
  );

  // res.uploadBlobResponse;
  res
    .status(uploadBlobResponse._response.status)
    .json({ requestId: uploadBlobResponse.requestId });
  // res = uploadBlobResponse._response;
});

// A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

// Start the server
app.listen(port, () => {
  console.log(`httprequestsproxynodejs listening at http://localhost:${port}`);
});
