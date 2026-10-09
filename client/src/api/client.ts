import { create } from 'axios';

// set EXPO_PUBLIC_API_URL to reach the server from a phone (your computer's LAN IP), see .env.example
export const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';
const client = create({baseURL})

export default client;