import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateStyledResume, ResumeData } from './resume-generator';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data: ResumeData = req.body;

    // Пути к ресурсам
    const basePath = process.cwd();
    const fontPath = path.join(basePath, 'assets/fonts/RobotoforLearning-Bold_0.ttf');
    const fontPath2 = path.join(basePath, 'assets/fonts/RobotoforLearning-Black_0.ttf');
    const svgBracesPath = path.join(basePath, 'assets/Back.svg');
    const photoPath = path.join(basePath, 'assets/photo.jpg');

    console.log('📄 Generating PDF...');
    console.log('🔤 Font 1:', fs.existsSync(fontPath) ? 'OK' : 'MISSING', fontPath);
    console.log('🔤 Font 2:', fs.existsSync(fontPath2) ? 'OK' : 'MISSING', fontPath2);
    console.log('🖼️ Photo:', fs.existsSync(photoPath) ? 'OK' : 'MISSING', photoPath);

    // Временный файл
    const os = require('os');
    const outputPath = path.join(os.tmpdir(), `resume_${Date.now()}.pdf`);

    await generateStyledResume(
      data,
      photoPath,
      outputPath,
      fontPath,
      fontPath2,
      svgBracesPath
    );

    // Читаем и отправляем
    const pdfBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath); // Удаляем временный файл

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.status(200).send(pdfBuffer);

  } catch (error: any) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate resume',
      details: error.message
    });
  }
}