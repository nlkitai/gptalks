import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {openAiChatFetchHandler} from './routes/chat/openAiFetch.route';
import {openAiChatStreamHandler} from './routes/chat/openAiStream.route';
import {getEnvVariable} from './utils/getEnvVariable';

const defaultPort = 6060;

const port = Number(getEnvVariable('port')) || defaultPort;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Nlux Demo APIs!');
});

app.post('/openai/chat/stream', openAiChatStreamHandler);
app.post('/openai/chat/fetch', openAiChatFetchHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
