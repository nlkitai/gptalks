import {Request} from 'express';
import {validateMessage} from './validateMessage';
import {validateModel} from './validateModel';

export const validateChatRequest = (req: Request): {
    isValid: boolean;
    errorMessage?: string;
} => {
    if (typeof req.body !== 'object' || !req.body) {
        return {
            isValid: false,
            errorMessage: 'A valid request body is required',
        };
    }

    if (typeof req.body.prompt !== 'string' || req.body.prompt === '') {
        return {
            isValid: false,
            errorMessage: 'A valid prompt is required',
        };
    }

    if (typeof req.body.conversation !== 'undefined' && (
        !Array.isArray(req.body.conversation) ||
        req.body.conversation.some((msg: any) => !validateMessage(msg).isValid)
    )) {
        return {
            isValid: false,
            errorMessage: 'When a conversation is provided, it must be an array of valid messages',
        };
    }

    return {
        isValid: true,
    };
};
