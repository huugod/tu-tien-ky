const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost', 
    port: 3306,
    user: 'root', 
    password: 'Vhuu@2002',
    database: 'tu_tien_db',
    connectionLimit: 10,
    idleTimeout: 60000, 
    acquireTimeout: 60000,
    // Trả về các số lớn (BIGINT) dưới dạng chuỗi để tránh lỗi JSON serialization
    supportBigNumbers: true,
    bigNumberStrings: true,
});

module.exports = pool;