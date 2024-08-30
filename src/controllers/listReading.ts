import { Request, Response } from 'express';
import prisma from '../index';

export const listReadings = async (req: Request, res: Response) => {
  const { customerCode } = req.params;
  const { measure_type } = req.query;

  // Validação do query parameter "measure_type"
  const validMeasureTypes = ['WATER', 'GAS'];

  let measureTypeFilter;
  if (measure_type) {
    const measureType = String(measure_type).toUpperCase(); 
    if (!validMeasureTypes.includes(measureType)) {
      return res.status(400).json({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      });
    }
    measureTypeFilter = measureType;
  }

  try {
    // Verificar se o cliente existe
    const customer = await prisma.customer.findUnique({
      where: { code: customerCode },
    });

    if (!customer) {
      return res.status(404).json({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    }

    // Buscar todas as leituras do cliente com ou sem o filtro de measure_type
    const readings = await prisma.reading.findMany({
      where: {
        customerId: customer.id,
        ...(measureTypeFilter && { measureType: measureTypeFilter }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Verifica se há leituras
    if (readings.length === 0) {
      return res.status(404).json({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    }

    // Formatar a resposta
    const response = {
      customer_code: customerCode,
      measures: readings.map((reading) => ({
        measure_uuid: reading.id,
        measure_datetime: reading.measureDatetime,
        measure_type: reading.measureType,
        has_confirmed: reading.confirmed,
        image_url: reading.imageUrl,
      })),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao buscar as leituras:', error);
    return res.status(500).json({ error: 'Erro ao buscar as leituras' });
  }
};
