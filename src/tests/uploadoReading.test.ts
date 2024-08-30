import { Request, Response } from 'express';
import { uploadReading } from '../controllers/uploadReading'; // Substitua pelo caminho correto
import prisma from '../index'; // Certifique-se de que o caminho está correto
import { uploadImageToGemini, extractMeasurementFromImage } from '../utils/googleGemini';
import path from 'path';
import fs from 'fs';

// Mock do Prisma Client
jest.mock('../index', () => ({
  customer: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  reading: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock das funções do Google Gemini
jest.mock('../utils/googleGemini', () => ({
  uploadImageToGemini: jest.fn(),
  extractMeasurementFromImage: jest.fn(),
}));

// Mock do sistema de arquivos
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('uploadReading', () => {
  const mockRequest = (body: any) => ({
    body,
  }) as Request;

  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Suprimir logs de erro durante os testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restaurar o comportamento original de console.error após cada teste
    (console.error as jest.Mock).mockRestore();
  });

  test('deve retornar 200 e dados da leitura quando tudo está correto', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    // Simulação de respostas do Prisma
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.reading.create as jest.Mock).mockResolvedValue({
      imageUrl: 'http://example.com/image.jpg',
      measure: 100,
      id: 'reading-id',
    });

    // Simulação das funções do Google Gemini
    (uploadImageToGemini as jest.Mock).mockResolvedValue('http://example.com/image.jpg');
    (extractMeasurementFromImage as jest.Mock).mockResolvedValue(100);

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      image_url: 'http://example.com/image.jpg',
      measure_value: 100,
      measure_uuid: 'reading-id',
    });
  });

  test('deve retornar 400 quando imageBase64 está vazio', async () => {
    const req = mockRequest({
      imageBase64: '',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  test('deve retornar 400 quando customerCode está vazio', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: '',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  test('deve retornar 400 quando measureType está vazio', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: '',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  test('deve retornar 400 quando measureType é diferente de WATER ou GAS', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'INVALID_TYPE',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  test('deve retornar 200 se measureType é igual a WATER', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    // Simulação de respostas do Prisma e das funções do Google Gemini
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.reading.create as jest.Mock).mockResolvedValue({
      imageUrl: 'http://example.com/image.jpg',
      measure: 100,
      id: 'reading-id',
    });
    (uploadImageToGemini as jest.Mock).mockResolvedValue('http://example.com/image.jpg');
    (extractMeasurementFromImage as jest.Mock).mockResolvedValue(100);

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      image_url: 'http://example.com/image.jpg',
      measure_value: 100,
      measure_uuid: 'reading-id',
    });
  });

  test('deve retornar 200 se measureType é igual a GAS', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'GAS',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    // Simulação de respostas do Prisma e das funções do Google Gemini
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.customer.create as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.reading.create as jest.Mock).mockResolvedValue({
      imageUrl: 'http://example.com/image.jpg',
      measure: 100,
      id: 'reading-id',
    });
    (uploadImageToGemini as jest.Mock).mockResolvedValue('http://example.com/image.jpg');
    (extractMeasurementFromImage as jest.Mock).mockResolvedValue(100);

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      image_url: 'http://example.com/image.jpg',
      measure_value: 100,
      measure_uuid: 'reading-id',
    });
  });

  test('deve retornar 400 quando measureDatetime está vazio', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: '',
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  test('deve retornar 400 para formato de imagem não suportado', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/unknown;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Formato de imagem não suportado.',
    });
  });

  test('deve retornar 409 quando já existe uma leitura para o mês atual', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    // Simulação de respostas do Prisma
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-reading-id' });

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'DOUBLE_REPORT',
      error_description: 'Leitura do mês já realizada.',
    });
  });

  test('deve retornar 500 quando há erro ao verificar ou criar o cliente', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    (prisma.customer.findUnique as jest.Mock).mockRejectedValue(new Error('Erro ao verificar cliente'));

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao processar o cliente' });
  });

  test('deve retornar 500 quando há erro ao criar leitura', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (uploadImageToGemini as jest.Mock).mockResolvedValue('http://example.com/image.jpg');
    (extractMeasurementFromImage as jest.Mock).mockResolvedValue(100);
    (prisma.reading.create as jest.Mock).mockRejectedValue(new Error('Erro ao criar leitura'));

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao processar a imagem' });
  });

  test('deve retornar 500 quando há erro ao fazer upload da imagem', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (uploadImageToGemini as jest.Mock).mockRejectedValue(new Error('Erro ao fazer upload da imagem'));

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao processar a imagem' });
  });

  test('deve retornar 500 quando há erro ao extrair medida da imagem', async () => {
    const req = mockRequest({
      imageBase64: 'data:image/jpeg;base64,abc123',
      customerCode: 'CUST123',
      measureType: 'WATER',
      measureDatetime: new Date().toISOString(),
    });
    const res = mockResponse();

    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findFirst as jest.Mock).mockResolvedValue(null);
    (uploadImageToGemini as jest.Mock).mockResolvedValue('http://example.com/image.jpg');
    (extractMeasurementFromImage as jest.Mock).mockRejectedValue(new Error('Erro ao extrair medida'));

    await uploadReading(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao processar a imagem' });
  });
});
