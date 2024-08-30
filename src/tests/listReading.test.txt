import { Request, Response } from 'express';
import { listReadings } from '../controllers/listReading';
import prisma from '../index';

// Mock do Prisma Client
jest.mock('../index', () => ({
  customer: {
    findUnique: jest.fn(),
  },
  reading: {
    findMany: jest.fn(),
  },
}));

describe('listReadings', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    req = {
      params: { customerCode: '12345' },
      query: { measure_type: 'WATER' },
    };

    res = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('deve retornar 400 se o measure_type for inválido', async () => {
    req.query!.measure_type = 'INVALID_TYPE';

    await listReadings(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'INVALID_TYPE',
      error_description: 'Tipo de medição não permitida',
    });
  });

  it('deve retornar 404 se o cliente não for encontrado', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

    await listReadings(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'Nenhuma leitura encontrada',
    });
  });

  it('deve retornar 404 se não houver leituras para o cliente', async () => {
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findMany as jest.Mock).mockResolvedValue([]);

    await listReadings(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'Nenhuma leitura encontrada',
    });
  });

  it('deve retornar 200 e listar as leituras se tudo estiver correto', async () => {
    const mockDate = new Date().toISOString(); // Use um valor fixo para garantir a consistência
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.reading.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'uuid-1',
        measureDatetime: mockDate,
        measureType: 'WATER',
        confirmed: true,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'uuid-2',
        measureDatetime: mockDate,
        measureType: 'WATER',
        confirmed: false,
        imageUrl: 'https://example.com/image2.jpg',
      },
    ]);

    await listReadings(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      customer_code: '12345',
      measures: [
        {
          measure_uuid: 'uuid-1',
          measure_datetime: expect.any(String), // Verifica se é uma string
          measure_type: 'WATER',
          has_confirmed: true,
          image_url: 'https://example.com/image1.jpg',
        },
        {
          measure_uuid: 'uuid-2',
          measure_datetime: expect.any(String), // Verifica se é uma string
          measure_type: 'WATER',
          has_confirmed: false,
          image_url: 'https://example.com/image2.jpg',
        },
      ],
    });
  });

  it('deve retornar 500 se houver um erro interno no servidor', async () => {
    (prisma.customer.findUnique as jest.Mock).mockRejectedValue(new Error('Erro no banco de dados'));

    await listReadings(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao buscar as leituras' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
