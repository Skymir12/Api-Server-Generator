import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';

// Интерфейс данных
export interface ResumeData {
  name: string;
  about: string; 
  education: string; 
  contacts: { telegram: string; email: string };
  profSkills: string[]; 
  softSkills: string[]; 
  caseStudy: {
    client: string;
    task: string;
    role: string;
    decision: string; 
    link: string;
    evaluation: string; 
  };
}

// Цветовая палитра
const COLORS = {
  sidebar: '#8248f5', 
  main: '#A87FF8',    
  textWhite: '#FFFFFF',
  textAccent: '#E1BEE7', 
};


export async function generateStyledResume(
  data: ResumeData, 
  photoPath: string,
  outputPath: string, 
  fontPath: string,
  fontPath2: string,
  svgBracesPath?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    stream.on('error', (err) => {
      console.error('❌ Stream error:', err);
      reject(err);
    });
    
    stream.on('finish', () => {
      console.log(`✅ Резюме сохранено: ${path.resolve(outputPath)}`);
      console.log(`📄 Размер файла: ${fs.statSync(outputPath).size} байт`);
      resolve();
    });

    try {
      // ПРОВЕРКА ШРИФТОВ (самая частая причина пустого PDF)
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Шрифт не найден: ${fontPath}`);
      }
      if (!fs.existsSync(fontPath2)) {
        throw new Error(`Шрифт не найден: ${fontPath2}`);
      }

      // Регистрация шрифтов
      doc.registerFont('CustomFont', fontPath);
      doc.registerFont('CustomFont2', fontPath2);
      
      //  Сразу устанавливаем шрифт перед любым текстом
      doc.font('CustomFont').fontSize(10);
      doc.font('CustomFont2').fontSize(10);

      const pageWidth = 595.28; 
      const pageHeight = 842;
      const sidebarWidth = 180; 

      //  ФОН
      doc.fillColor(COLORS.main).rect(sidebarWidth, 0, pageWidth - sidebarWidth, pageHeight).fill();

      //  SVG-скобки (опционально)
      if (svgBracesPath && fs.existsSync(svgBracesPath)) {
        try {
          const svgContent = fs.readFileSync(svgBracesPath, 'utf8');
          SVGtoPDF(doc, svgContent, 0, 0, {
            width: pageWidth,
            height: pageHeight,
            preserveAspectRatio: 'xMidYMid meet',
          });
        } catch (svgErr) {
          console.warn('⚠️ Не удалось загрузить SVG:', svgErr);
        }
      }

      //  Сайдбар 
      doc.fillColor(COLORS.sidebar).rect(0, 0, sidebarWidth, pageHeight).fill();

      //  ЛЕВАЯ КОЛОНКА
      doc.fillColor(COLORS.textWhite);
      doc.x = 20; 
      doc.y = 180; 

      //  Фото (с проверкой)
      const photoY = 20;
      if (photoPath && fs.existsSync(photoPath)) {
        doc.image(photoPath, 20, photoY, { fit: [140, 160] });
      } else {
        // Заглушка: рисуем серый прямоугольник вместо фото
        doc.fillColor('#CCCCCC').rect(20, photoY, 140, 160).fill();
        doc.fillColor(COLORS.textWhite).fontSize(8).text('Нет фото', 20, photoY + 70, { align: 'center', width: 140 });
      }

      //  Имя (с явным шрифтом)
      doc.font('CustomFont2').fontSize(14).fillColor(COLORS.textWhite);
      doc.text((data.name || 'Имя не указано').toUpperCase(), { 
        align: 'center', 
        width: sidebarWidth - 40,
        continued: false //  Важно: завершаем строку
      });

      //  Секции сайдбара
      addSidebarSection(doc, 'Обо мне', data.about || 'Не указано');
      addSidebarSection(doc, 'Образование', data.education || 'Не указано');
      addSidebarSection(doc, 'Контакты', `Телеграм: ${data.contacts?.telegram || '—'}\nEmail: ${data.contacts?.email || '—'}`);

      //  ОСНОВНАЯ ЧАСТЬ 
      doc.y = 40;
      doc.x = sidebarWidth + 30; 
      doc.fillColor(COLORS.textWhite); 
      doc.font('CustomFont2'); //  Заголовки жирным

      addMainSectionTitle(doc, 'Профессиональные навыки');

      addBulletList(doc, 'КЛЮЧЕВЫЕ НАВЫКИ', data.profSkills?.slice(0, 1) || []); 
      addBulletList(doc, 'НАВЫКИ IT-МЕНЕДЖМЕНТА', data.profSkills?.slice(1, 3) || []);
      addBulletList(doc, 'МЯГКИЕ НАВЫКИ', data.softSkills || []);

      doc.moveDown(1);
      addMainSectionTitle(doc, 'Кейс');

      //  Текст кейса
      doc.font('CustomFont').fontSize(11).fillColor(COLORS.textWhite);
      doc.text(`Заказчик: ${data.caseStudy?.client || '—'}`, { continued: false });
      doc.text(`Задача: ${data.caseStudy?.task || '—'}`, { continued: false });
      doc.text(`Роль: ${data.caseStudy?.role || '—'}`, { continued: false });
      doc.text(`Решение: ${data.caseStudy?.decision || '—'}`, { continued: false });

      doc.fillColor(COLORS.textAccent);
      doc.text(`${data.caseStudy?.link || ''}`, { continued: false });

      doc.fillColor(COLORS.textWhite); 
      doc.text(`Оценка: ${data.caseStudy?.evaluation || '—'}`, { continued: false });

      //  Завершаем документ
      doc.end();

    } catch (error) {
      console.error('❌ Ошибка генерации PDF:', error);
      doc.end();
      reject(error);
    }
  });
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ 

function addSidebarSection(doc: PDFKit.PDFDocument, title: string, content: string): void {
  doc.moveDown(1);
  
  // Заголовок
  doc.font('CustomFont2').fontSize(14).fillColor(COLORS.textWhite);
  doc.text(`{${title}}`, { continued: false });
  
  doc.moveDown(0.3);
  
  // Контент
  doc.font('CustomFont').fontSize(10);
  doc.text(content || '—', { align: 'justify', width: 140, continued: false }); 
  doc.x = 20; // Сброс позиции
}

function addMainSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  doc.font('CustomFont2').fontSize(18).fillColor(COLORS.textWhite);
  doc.text(`{${title}}`, { continued: false });
  doc.moveDown(0.5);
}

function addBulletList(doc: PDFKit.PDFDocument, title: string, items: string[]): void {
  if (!items || items.length === 0) return;
  
  // Заголовок списка
  doc.font('CustomFont2').fontSize(12).fillColor(COLORS.textWhite);
  doc.text(title.toUpperCase(), { continued: false });
  
  // Элементы
  doc.font('CustomFont').fontSize(10);
  items.forEach(item => {
    doc.text(`• ${item}`, { indent: 10, continued: false });
  });
  doc.moveDown(0.5);
}