import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateStyledResume, ResumeData } from './resume-generator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/generate-resume', async (req: Request, res: Response) => {
  try {
    const data: ResumeData = req.body;
    
    // Временная папка для генерации
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `resume_${Date.now()}.pdf`);
    
    // Пути к ресурсам (используйте __dirname для надёжности)
    const fontPath = path.join(__dirname, '../assets/fonts/RobotoforLearning-Bold_0.ttf'); 
const fontPath2 = path.join(__dirname, '../assets/fonts/RobotoforLearning-Black_0.ttf');
    const svgBracesPath = path.join(__dirname, '../assets/Back.svg');
    const photoPath = path.join(__dirname, '../assets/photo.jpg'); // Заглушка, если фото не передано
    
    // Логи для отладки
    console.log('📄 Generating PDF to:', outputPath);
    console.log('🔤 Font 1:', fs.existsSync(fontPath) ? 'OK' : 'MISSING', fontPath);
    console.log('🔤 Font 2:', fs.existsSync(fontPath2) ? 'OK' : 'MISSING', fontPath2);
    console.log('🖼️ Photo:', fs.existsSync(photoPath) ? 'OK' : 'MISSING', photoPath);
    console.log('🎨 SVG:', svgBracesPath && fs.existsSync(svgBracesPath) ? 'OK' : 'MISSING', svgBracesPath);

    //  ВЫЗОВ ФУНКЦИИ — правильный порядок аргументов:
    // (данные, фото, путь_сохранения, шрифт1, шрифт2, [svg])
    await generateStyledResume(
      data, 
      photoPath,       //  Путь к фото
      outputPath,      //  Куда сохранить PDF
      fontPath,        //  Шрифт обычный
      fontPath2,       //  Шрифт жирный
      svgBracesPath    //  SVG (опционально)
    );
    
    //  Отправляем файл клиенту
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume.pdf"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      //  Удаляем временный файл
      fs.unlinkSync(outputPath);
      console.log('🗑️ Temp file deleted:', outputPath);
    });
    
  } catch (error: any) {
    console.error('❌ Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate resume', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});