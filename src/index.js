import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import httpStatus from 'http-status-codes';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import router from './routes.js';
import handleError from './exceptions/handler.exception.js';


const app = express();
dotenv.config();

app.disable('x-powered-by');
app.use(
  cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTION',
    credentials: true,
  })
);

const port = process.env.PORT || 3000;
app.use(
  bodyParser.json({
    limit: '50mb',
    type: ['application/json', 'application/vnd.api+json'],
  })
);
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 50000,
    extended: true,
  })
);
app.use(
  bodyParser.raw({ type: ['application/json', 'application/vnd.api+json'] })
);
app.use(bodyParser.text({ type: 'text/html' }));

app.use('/api/v1', router);

app.get('/api/download', (req, res, next) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      code: httpStatus.BAD_REQUEST,
      message: 'File path not provided.',
    });
  }

  // Ubah path relatif menjadi absolute
  const resolvedPath = path.resolve(filePath);

  // Periksa apakah file ada secara asinkron
  fs.access(resolvedPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        code: httpStatus.NOT_FOUND,
        message: 'File not found.',
      });
    }
    // Kirim file secara langsung tanpa pipe
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return next(err);
      }
    });
  });
});

app.route('/').get((req, res) => {
  return res.json({
    message: 'Welcome to the API',
  });
});

app.use((req, res) => {
  return res.json({
    errors: {
      status: res.statusCode,
      data: null,
      error: {
        code: httpStatus.StatusCodes.NOT_FOUND,
        message: 'ENDPOINT_NOTFOUND',
      },
    },
  });
});

app.use(handleError);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);
  });
});

// startWhatsApp(io)
// .then(() => {
//     console.log('WhatsApp client started');
//   })
//   .catch((err) => console.error(err));


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// parsing biginteger
BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};
