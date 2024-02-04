import {Request, Response} from 'express';
import OpenAI from 'openai';
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionRole,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
} from 'openai/src/resources/chat/completions';
import {ChatRequest} from '../../types/chat/chatRequest';
import {getEnvVariable} from '../../utils/getEnvVariable';
import {validateChatRequest} from '../../validators/chat/validateChatRequest';
import {openAiDefaultChatModel, senderId, senderType} from './openAi.config';

const openai = new OpenAI({
    apiKey: getEnvVariable('OPENAI_API_KEY'),
});

type PossibleMessageType = ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam;

export const openAiChatStreamHandler = async (req: Request, response: Response) => {
    const {isValid, errorMessage} = validateChatRequest(req);
    if (!isValid) {
        response.status(400).json({error: errorMessage});
        return;
    }

    const chatRequest: ChatRequest = req.body;

    //
    // Create the payload to send to OpenAI
    //
    const messages: Array<PossibleMessageType> = chatRequest.conversation?.map((message) => {
        const role: ChatCompletionRole = message.senderType === 'user' ? 'user' : (
            message.senderType === 'bot' ? 'assistant' : 'system'
        );

        return {
            role,
            content: message.content,
        };
    }) ?? [];

    messages.push({
        role: 'user',
        content: chatRequest.prompt,
    });

    //
    // Start the Server-Sent Events stream
    //
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders(); // Flush the headers to establish SSE with client

    try {
        //
        // Make the chat completion request
        //
        const completion = await openai.chat.completions.create({
            messages,
            model: chatRequest.model ?? openAiDefaultChatModel,
            stream: true,
        });

        //
        // Stream the results to the client
        //
        let connectionEndedByClient = false;
        for await (const chunk of completion) {
            if (connectionEndedByClient) {
                break;
            }

            if (!Array.isArray(chunk.choices) || chunk.choices.length === 0) {
                continue;
            }

            const chunkToSendToClient = chunk.choices[0].delta.content;
            if (!chunkToSendToClient) {
                continue;
            }

            response.write(chunkToSendToClient);
        }

        //
        // Close the SSE stream
        //
        response.end();

        //
        // If client closes connection, stop sending events
        //
        response.on('close', () => {
            connectionEndedByClient = true;
        });
    } catch (e) {
        response.status(500).json({error: 'Internal server error'});
        response.end();
    }
};
