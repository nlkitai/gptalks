export const validateMessage = (message: any): {
    isValid: boolean;
    errorMessage?: string;
} => {
    if (typeof message !== 'object' || message === null) {
        return {
            isValid: false,
            errorMessage: 'A valid message object is required',
        };
    }

    if (typeof message.content !== 'string' || message.content.length === 0) {
        return {
            isValid: false,
            errorMessage: 'A valid content attribute for the message is required',
        };
    }

    if (typeof message.senderType !== 'string' || !['user', 'bot', 'system'].includes(message.senderType)) {
        return {
            isValid: false,
            errorMessage: 'A valid senderType is required',
        };
    }

    return {
        isValid: true,
    };
}
