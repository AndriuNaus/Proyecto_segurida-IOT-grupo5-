const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Configurar para renderizar para imprimir y en un tamaño grande para que se vea bien
    await page.emulateMediaType('print');
    
    // Resolver la ruta absoluta
    const htmlPath = path.resolve('.mdplanes', 'infografia (1).html');
    const htmlUrl = 'file://' + htmlPath;
    
    console.log(`Cargando archivo: ${htmlUrl}`);
    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });
    
    const outputPath = path.resolve('.mdplanes', 'infografia_iot_grupo5.pdf');
    
    // Generar el PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true, // Importante para que los fondos y colores salgan en el PDF
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    console.log(`¡Infografía exportada exitosamente a: ${outputPath}!`);
    await browser.close();
  } catch (error) {
    console.error('Error generando PDF:', error);
    process.exit(1);
  }
})();
