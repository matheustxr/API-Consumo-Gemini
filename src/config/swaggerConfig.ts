const swaggerOptions = {
	swaggerDefinition: {
	  openapi: '3.0.0',
	  info: {
		title: 'API de Gestão de Leitura de Consumo de Água e Gás',
		version: '1.0.0',
		description: 'API de back-end para gerenciar leituras de consumo de água e gás.',
	  },
	  servers: [
		{ url: 'http://localhost:80' },
	  ],
	},
	apis: ['./src/routes/*.ts'],
};


  
export default swaggerOptions;
  