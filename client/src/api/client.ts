import { create } from 'axios';

export const baseURL = 'http://localhost:3000/';
const client = create({baseURL})

export default client;