import { Request, Response } from 'express';
import prisma from '../index';

export const confirmReading = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { confirmed_value } = req.body;
  
	if (confirmed_value === undefined) {
	  return res.status(400).json({
		error_code: 'INVALID_DATA',
		error_description: 'Dados incompletos ou inválidos.',
	  });
	}
  
	try {
	  const reading = await prisma.reading.findUnique({ where: { id: Number(id) } });
  
	  if (!reading) {
		return res.status(404).json({
		  error_code: 'MEASURE_NOT_FOUND',
		  error_description: 'Leitura não encontrada.',
		});
	  }
  
	  if (reading.confirmed) {
		return res.status(409).json({
		  error_code: 'CONFIRMATION_DUPLICATE',
		  error_description: 'Leitura já confirmada.',
		});
	  }
  
	  await prisma.reading.update({
		where: { id: Number(id) },
		data: {
		  confirmed: true,
		  measure: confirmed_value,
		},
	  });
  
	  res.status(200).json({ success: true });
	} catch (error) {
	  console.error('Erro ao confirmar a leitura:', error);
	  return res.status(500).json({ error: 'Erro ao confirmar a leitura.' });
	}
  };