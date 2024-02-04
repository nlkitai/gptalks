const supportedModels = [
    'gpt-3.5-turbo',
];

export const validateModel = (provider: 'openai', model: any): {
    isValid: boolean;
    errorMessage?: string;
} => {
    if (provider !== 'openai') {
        return {
            isValid: false,
            errorMessage: 'A valid provider is required',
        };
    }

    if (typeof model !== 'string' || !supportedModels.includes(model)) {
        return {
            isValid: false,
            errorMessage: 'A valid model is required',
        };
    }

    return {
        isValid: true,
    };
};
