import express from "express"
import configViewEngine from "./configs/viewEngine";
import initWebRouter from "./route/web"
import connection from "./configs/connectDatabse"
import initAPIRoute from "./route/api"
require('dotenv').config()
var cors = require('cors')
//test JWT
import { createJWT, verifyJWT } from "./middleware/JWTAction"

const app = express()
const port = 8081
// process.env.PORT
app.use(cors({ credentials: true, origin: true }));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// app.use(function (req, res, next) {
//     // res.setHeader("Access-Control-Allow-Origin", 'http://127.0.0.1:8080');
//     // res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
//     // res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
// createJWT()
// verifyJWT('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiUGhvbmciLCJuZ2FuaCI6ImPDtG5nIG5naOG7hyB0aMO0bmcgdGluIiwiaWF0IjoxNjYzNDkyMzg1fQ.cMItnm-utS7ybNFhustcGDUREMPVS9ZO6WJLbMryibQ')
configViewEngine(app)

initWebRouter(app)

initAPIRoute(app)
app.use((req, res) => {
    res.send('404 NOT FOUND')
})

app.listen(port, () => {
    console.log(`Example app listening on port localhost:${port}`)
})