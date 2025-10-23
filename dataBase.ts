import { Pool } from 'pg';

//Define DataBase
export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '112233',
    port: 5432,
});

