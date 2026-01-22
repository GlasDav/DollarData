import { Platform } from 'react-native';

const ENV = {
    dev: {
        apiUrl: Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api',
    },
    prod: {
        apiUrl: 'https://dollardata.au/api',
    },
};

// Toggle manually or via env vars in future
const isProd = false;

export const API_BASE_URL = isProd ? ENV.prod.apiUrl : ENV.dev.apiUrl;
