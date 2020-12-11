var http = require('http');
// const request = require('request');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const { resolveSoa } = require('dns');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Remove the X-Powered-By headers.
const removeThoseHeaders = [
    'x-powered-by',
    'set-cookie',
    'x-request-id',
    'x-frame-options',
    'access-control-allow-origin',
    'x-xss-protection',
    'x-content-type-options',
    'referrer-policy',
    'content-security-policy',
    'strict-transport-security',
    'cf-cache-status'
];


app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/proxyreq', (req, res, next) =>{
    console.log('proxyreq');
    console.log('req.body[\'uri\']: ', req.body['uri']);
    console.log('req.body[\'method\']: ', req.body['method']);
    console.log('req.body[\'body\']: ', req.body['body']);
    console.log('req.body[\'json\']: ', req.body['json']);
    console.log('req.body[\'headers\']: ', req.body['headers']);
    let headersReq = {
        'Content-Type': 'application/json',
        'Range': ' bytes=0-1499'
    }
    if (req.body['headers'] !== null) {
        headersReq = req.body['headers'];
    }
    const bodyReq = req.body['body'];
    if(bodyReq === undefined) {
        bodyReq = null;
    }
    const contenttype = null;
    if(req.body['json'] === true) {
        contenttype = 'application/json';
    }
    fetch(req.body['uri'], {
        method: req.body['method'],
        body: bodyReq,
        headers: headersReq,
    })
    .then(res => res.json())
    .then(json => {
        console.log(json);
        res.json(json);
    });
});

app.listen(port, () => {
    console.log(`httprequestsproxynodejs listening at http://localhost:${port}`)
});
