import { Request, Response } from 'express';
import { confirmReading } from '../controllers/confirmReading';
import prisma from '../index';

// Mock do Prisma Client
jest.mock('../index', () => ({
  reading: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

describe('confirmReading', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();

    req = {
      params: { id: '1' },
      body: { confirmed_value: 42 },
    };

    res = {
      status: mockStatus,
      json: mockJson,
    };

    // Spy on console.error to prevent logs during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  it('deve retornar 400 se confirmed_value for indefinido', async () => {
    req.body = {};

    await confirmReading(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  });

  it('deve retornar 404 se a leitura não for encontrada', async () => {
    (prisma.reading.findUnique as jest.Mock).mockResolvedValue(null);

    await confirmReading(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'MEASURE_NOT_FOUND',
      error_description: 'Leitura não encontrada.',
    });
  });

  it('deve retornar 409 se a leitura já tiver sido confirmada', async () => {
    (prisma.reading.findUnique as jest.Mock).mockResolvedValue({ confirmed: true });

    await confirmReading(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      error_code: 'CONFIRMATION_DUPLICATE',
      error_description: 'Leitura já confirmada.',
    });
  });

  it('deve retornar 200 e atualizar a leitura se tudo estiver correto', async () => {
    (prisma.reading.findUnique as jest.Mock).mockResolvedValue({ confirmed: false });
    (prisma.reading.update as jest.Mock).mockResolvedValue({ confirmed: true, measure: 42 });

    await confirmReading(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ success: true });
  });

  it('deve retornar 500 se houver um erro interno do servidor', async () => {
    (prisma.reading.findUnique as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    await confirmReading(req as Request, res as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao confirmar a leitura.' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao confirmar a leitura:', expect.any(Error));
  });
});
