const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travel Together API',
      version: '1.0.0',
      description: 'API для приложения путешествий',
    },
    servers: [
      {
        url: 'http://localhost:3001', // Исправляем порт на 3001
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Правильный путь (swagger.js и routes на одном уровне)
};

const specs = swaggerJsdoc(options);

// Добавим диагностику
console.log('=== SWAGGER CONFIG ===');
console.log('Searching routes in: ./src/routes/*.js');
console.log('Found paths:', Object.keys(specs.paths || {}));
console.log('Server URL: http://localhost:3001');
console.log('=====================');

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }));
};