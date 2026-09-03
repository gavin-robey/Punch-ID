import { create } from 'axios';

const baseURL = 'http://localhost:3000/';
const client = create({baseURL})

export default client;