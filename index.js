var http = require('http');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/proxyreq', function (req, res, next) {
    console.log('proxyreq');
    // console.log('req body: ', req.body);
    // console.log('req.body.uri: ', req.body.uri);
    console.log('req.body[\'uri\']: ', req.body['uri']);
    console.log('req.body[\'method\']: ', req.body['method']);
    console.log('req.body[\'body\']: ', req.body['body']);
    const bodyReq = req.body['body'];
    if(bodyReq === undefined) {
        bodyReq = null;
    }
    request({
        uri: req.body['uri'],
        method: req.body['method'],
        body: bodyReq,
        function(error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
                res.json(body);
            } else {
                res.json(error);
            }
        }
    }).pipe(res);
});

app.listen(port, () => {
    console.log(`httprequestsproxynodejs listening at http://localhost:${port}`)
});
