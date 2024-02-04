import 'dotenv/config';
import {config} from 'platformsh-config';

const platformConfig = config();

export const getEnvVariable = (name: string): string | undefined => {
    if (name === 'port' && platformConfig.port) {
        return platformConfig.port.toString();
    }

    const platformValue = platformConfig.variable(name);
    if (platformValue) {
        return platformValue;
    }

    const value = process.env[name];
    if (value) {
        return value;
    }

    return undefined;
}
