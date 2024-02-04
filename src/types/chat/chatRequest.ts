import {Message} from './message';

export type ChatRequest = {
    prompt: string;
    model?: string;
    conversation?: Message[];
}
