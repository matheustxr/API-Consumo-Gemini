import express from 'express';
import { uploadReading } from '../controllers/uploadReading';
import { confirmReading } from '../controllers/confirmReading';
import { listReadings } from '../controllers/listReading';

const router = express.Router();

router.post('/upload', uploadReading);
router.patch('/confirm/:id', confirmReading);
router.get('/:customerCode/list', listReadings);

//DOCUEMENTAÇÃO SWAGGER
/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Recebe uma imagem em base64, consulta o Gemini e retorna a medida lida pela API
 *     description: Este endpoint recebe uma imagem codificada em base64, verifica se já existe uma leitura para o tipo de medição no mês atual, processa a imagem usando a API Google Gemini para extrair o valor da medida e retorna o link da imagem, o UUID da medida e o valor numérico reconhecido.
 *     requestBody:
 *       description: Dados necessários para o upload da imagem e processamento da medida.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Imagem em formato base64.
 *                 example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAA...'
 *               customerCode:
 *                 type: string
 *                 description: Código do cliente para identificar a leitura.
 *                 example: '12345'
 *               measureType:
 *                 type: string
 *                 description: Tipo de medição. Pode ser `WATER` ou `GAS`.
 *                 enum:
 *                   - WATER
 *                   - GAS
 *                 example: 'WATER'
 *               measureDatetime:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora da medição.
 *                 example: '2024-08-29T14:55:00Z'
 *             required:
 *               - imageBase64
 *               - customerCode
 *               - measureType
 *               - measureDatetime
 *     responses:
 *       '200':
 *         description: Operação realizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 image_url:
 *                   type: string
 *                   description: URL temporária para a imagem.
 *                   example: 'https://example.com/image.jpg'
 *                 measure_value:
 *                   type: number
 *                   format: float
 *                   description: Valor numérico reconhecido pela LLM.
 *                   example: 42.5
 *                 measure_uuid:
 *                   type: string
 *                   description: UUID da medida.
 *                   example: 'e6d4f9e3-93e6-4a37-8d29-ef5348b0e6bb'
 *       '400':
 *         description: Dados fornecidos no corpo da requisição são inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: INVALID_DATA
 *                 error_description:
 *                   type: string
 *                   example: Dados incompletos ou inválidos.
 *       '409':
 *         description: Já existe uma leitura para este tipo no mês atual.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: DOUBLE_REPORT
 *                 error_description:
 *                   type: string
 *                   example: Leitura do mês já realizada.
 *       '500':
 *         description: Erro interno ao processar a solicitação.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erro ao processar a solicitação.
 *     security:
 *       - api_key: []
 */




/**
 * @swagger
 * /confirm/{id}:
 *   patch:
 *     summary: Confirma ou corrige o valor lido por uma leitura
 *     description: Este endpoint é responsável por confirmar ou corrigir o valor lido por uma leitura. Não faz novas consultas ao LLM para validar o novo resultado recebido.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID da leitura a ser confirmada ou corrigida.
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Dados necessários para confirmar ou corrigir o valor da leitura.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmed_value:
 *                 type: integer
 *                 description: Novo valor confirmado para a leitura.
 *                 example: 42
 *             required:
 *               - confirmed_value
 *     responses:
 *       '200':
 *         description: Operação realizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '400':
 *         description: Dados fornecidos no corpo da requisição são inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: INVALID_DATA
 *                 error_description:
 *                   type: string
 *                   example: Dados incompletos ou inválidos.
 *       '404':
 *         description: Leitura não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: MEASURE_NOT_FOUND
 *                 error_description:
 *                   type: string
 *                   example: Leitura não encontrada.
 *       '409':
 *         description: Leitura já confirmada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: CONFIRMATION_DUPLICATE
 *                 error_description:
 *                   type: string
 *                   example: Leitura já confirmada.
 *     security:
 *       - api_key: []
 */



/**
 * @swagger
 * /{customerCode}/list:
 *   get:
 *     summary: Lista as medidas realizadas por um determinado cliente
 *     description: Este endpoint lista todas as leituras realizadas por um cliente específico. Opcionalmente, pode receber um parâmetro de query `measure_type` para filtrar as leituras por tipo, sendo `WATER` ou `GAS`. A validação do tipo é case insensitive.
 *     parameters:
 *       - name: customerCode
 *         in: path
 *         description: Código do cliente cujas leituras devem ser listadas.
 *         required: true
 *         schema:
 *           type: string
 *       - name: measure_type
 *         in: query
 *         description: Tipo de medição para filtrar os resultados. Pode ser `WATER` ou `GAS`. A validação é case insensitive.
 *         schema:
 *           type: string
 *           enum:
 *             - WATER
 *             - GAS
 *     responses:
 *       '200':
 *         description: Operação realizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer_code:
 *                   type: string
 *                   description: Código do cliente cujas leituras foram listadas.
 *                   example: '12345'
 *                 measures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       measure_uuid:
 *                         type: string
 *                         description: UUID da leitura.
 *                         example: 'e6d4f9e3-93e6-4a37-8d29-ef5348b0e6bb'
 *                       measure_datetime:
 *                         type: string
 *                         format: date-time
 *                         description: Data e hora da leitura.
 *                         example: '2024-08-29T14:55:00Z'
 *                       measure_type:
 *                         type: string
 *                         description: Tipo de medição.
 *                         example: 'WATER'
 *                       has_confirmed:
 *                         type: boolean
 *                         description: Indica se a leitura foi confirmada.
 *                         example: true
 *                       image_url:
 *                         type: string
 *                         description: URL da imagem associada à leitura, se disponível.
 *                         example: 'https://example.com/image.jpg'
 *       '400':
 *         description: Parâmetro `measure_type` diferente de `WATER` ou `GAS`.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: INVALID_TYPE
 *                 error_description:
 *                   type: string
 *                   example: Tipo de medição não permitida
 *       '404':
 *         description: Nenhum registro encontrado para o cliente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: MEASURES_NOT_FOUND
 *                 error_description:
 *                   type: string
 *                   example: Nenhuma leitura encontrada
 *     security:
 *       - api_key: []
 */

export default router;
