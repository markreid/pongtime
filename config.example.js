module.exports = {
    EXPRESS_PORT: 2000,
    COOKIE_SECRET: 'put your cookie secret here buddy',
    DB: {
        NAME: 'pongdb',
        USER: 'pong',
        PASS: 'pong',
        DIALECT: 'postgres',
        PORT: '5432',
        HOST: 'localhost'
    },
    REDIS: {
        URL: 'redis://127.0.0.1:6379/8',
        HOST: 'localhost',
        PORT: '6379',
        DB: '8',
        PASS: '',
        PREFIX: 'pongsession'
    },
    AUTH: {
        GOOGLE: {
            RETURNURL: 'http://pongdomain.com/auth/google/return',
            REALM: 'http://pongdomain.com'
        }
    }
}
