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

export const openAiChatFetchHandler = async (req: Request, response: Response) => {
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
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Access-Control-Allow-Origin', '*');

    try {
        //
        // Make the chat completion request
        //
        const completion = await openai.chat.completions.create({
            messages,
            model: chatRequest.model ?? openAiDefaultChatModel,
            stream: false,
        });

        //
        // Check for a valid response
        //
        const completionChoices = completion.choices;
        if (!Array.isArray(completionChoices) || completionChoices.length === 0) {
            response.status(500).json({error: 'Chat completion failed'});
            response.end();
            return;
        }

        const completionChoice = completionChoices[0];
        const message = completionChoice?.message?.content;
        if (typeof message !== 'string' || message === '') {
            response.status(500).json({error: 'Chat completion response was empty'});
            response.end();
            return;
        }

        //
        // Send the response to the client in a single JSON object
        //
        const messageToSendToClient = {
            content: message,
            senderType,
            senderId,
        };

        response.json(messageToSendToClient);
        response.end();
    } catch (e) {
        response.status(500).json({error: 'Internal server error'});
        response.end();
    }
};
