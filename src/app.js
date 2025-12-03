const express = require('express');
const db = require('./db');
import dotenv from 'dotenv'
dotenv.config()
import server from './server.js' 
import cookieParser from "cookie-parser";




const app = express();
app.use(cookieParser());


app.get('/version', async (req, res) => {
try {
const result = await db.query('SELECT VERSION()');
res.send(result.rows[0]);
} catch (error) {
res.status(500).send(error);
}
});


app.listen(3000, () => console.log('Server running on port 3000'));