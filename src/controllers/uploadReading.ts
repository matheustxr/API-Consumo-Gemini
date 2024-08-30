import { Request, Response } from 'express';
import prisma from '../index'; // Verifique se o Prisma Client está importado corretamente
import { uploadImageToGemini, extractMeasurementFromImage } from '../utils/googleGemini';
import path from 'path';
import fs from 'fs';

// Diretório de upload das imagens
const uploadFolderPath = path.join(__dirname, '../uploads');

export const uploadReading = async (req: Request, res: Response) => {
  const { imageBase64, customerCode, measureType, measureDatetime } = req.body;

  // Validação dos dados
  if (!imageBase64 || !customerCode || !measureType || (measureType !== 'WATER' && measureType !== 'GAS') || !measureDatetime ) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Dados incompletos ou inválidos.',
    });
  }

  // Validação do formato base64 e tipos suportados
  const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  if (!mimeTypeMatch || !/^data:image\/(png|jpeg|webp|heic|heif);base64,/.test(imageBase64)) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Formato de imagem não suportado.',
    });
  }

  const mimeType = mimeTypeMatch[1];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Tipo de imagem não suportado.',
    });
  }

  // Verificar se o cliente existe ou criar novo cliente
  let customerId;
  try {
    let customer = await prisma.customer.findUnique({
      where: { code: customerCode },
    });

    if (customer) {
      customerId = customer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: { code: customerCode },
      });
      customerId = newCustomer.id;
    }
  } catch (error) {
    console.error('Erro ao verificar ou criar o cliente:', error);
    return res.status(500).json({ error: 'Erro ao processar o cliente' });
  }

  // Verificar se já existe uma leitura no mês atual para o cliente e tipo de medição
  try {
    const firstDayOfMonth = new Date(measureDatetime);
    firstDayOfMonth.setDate(1);

    const existingReading = await prisma.reading.findFirst({
      where: {
        customerId: customerId,
        measureType: measureType,
        measureDatetime: {
          gte: firstDayOfMonth,
          lt: new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1), // Limite para o último dia do mês
        },
      },
    });

    if (existingReading) {
      return res.status(409).json({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada.',
      });
    }
  } catch (error) {
    console.error('Erro ao verificar leituras existentes:', error);
    return res.status(500).json({ error: 'Erro ao verificar leituras' });
  }

  // Salvar imagem na pasta uploads e fazer upload para o Google Gemini
  const filename = `${customerCode}_${measureType}_${Date.now()}.jpg`;
  const filePath = path.join(uploadFolderPath, filename);

  try {
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(imageData, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Substitua por sua função de upload para o Google Gemini
    const fileUri = await uploadImageToGemini(filePath, mimeType, filename);
    fs.unlinkSync(filePath); // Remover o arquivo após o upload

    // Extrair valor numérico da imagem usando o Google Gemini
    const measureValue = await extractMeasurementFromImage(fileUri, mimeType);

    // Verificar se measureValue é um número
    if (typeof measureValue !== 'number' || isNaN(measureValue)) {
      console.error('Valor recebido da API:', measureValue);
      throw new Error('Valor de medida inválido recebido da API');
    }

    // Criar leitura no banco de dados
    const reading = await prisma.reading.create({
      data: {
        imageUrl: fileUri,
        measure: measureValue,
        measureType: measureType,
        customerId: customerId,
        measureDatetime: new Date(measureDatetime),
      },
    });

    return res.status(200).json({
      image_url: reading.imageUrl,
      measure_value: reading.measure,
      measure_uuid: reading.id,
    });
  } catch (error) {
    console.error('Erro ao processar a imagem:', error);
    return res.status(500).json({ error: 'Erro ao processar a imagem' });
  }
};
