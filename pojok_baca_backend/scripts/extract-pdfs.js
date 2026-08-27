const fs = require('fs-extra');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const EBOOK_DIR = path.join(__dirname, '..', '..', '..', 'E-Book');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'books.json');

function parseFilename(filename) {
  const name = filename.replace('.pdf', '');
  
  const patterns = [
    /^Salinan\s+Salinan\s+(.+?)\s+by\s+(.+)$/i,
    /^Salinan\s+(.+?)\s+by\s+(.+)$/i,
    /^(.+?)\s+by\s+(.+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        judul: match[1].trim(),
        penulis: match[2].trim()
      };
    }
  }
  
  return {
    judul: name,
    penulis: 'Unknown'
  };
}

function generateCoverFilename(judul) {
  const slug = judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${slug}.jpg`;
}

async function extractPdf(pdfPath, id) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy();
    
    const filename = path.basename(pdfPath);
    const { judul, penulis } = parseFilename(filename);
    const cover_buku = generateCoverFilename(judul);
    
    const sinopsis = data.text.slice(0, 500).replace(/\s+/g, ' ').trim() + '...';
    
    return {
      id_buku: id,
      judul,
      penulis,
      genre: 'Umum',
      cover_buku,
      sinopsis,
      textContent: data.text,
      pageCount: data.numpages,
      extractedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error extracting ${pdfPath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting PDF extraction...');
  console.log(`Source: ${EBOOK_DIR}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  
  const files = await fs.readdir(EBOOK_DIR);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  
  console.log(`Found ${pdfFiles.length} PDF files`);
  
  const books = [];
  let successCount = 0;
  
  for (let i = 0; i < pdfFiles.length; i++) {
    const filename = pdfFiles[i];
    const pdfPath = path.join(EBOOK_DIR, filename);
    
    process.stdout.write(`\r[${i + 1}/${pdfFiles.length}] Extracting: ${filename}...`);
    
    const book = await extractPdf(pdfPath, i + 1);
    if (book) {
      books.push(book);
      successCount++;
    }
  }
  
  console.log(`\n\nSuccessfully extracted: ${successCount}/${pdfFiles.length} books`);
  
  await fs.writeJson(OUTPUT_FILE, books, { spaces: 2 });
  console.log(`Data saved to ${OUTPUT_FILE}`);
  console.log(`Total size: ${(await fs.stat(OUTPUT_FILE)).size / 1024 / 1024} MB`);
}

main().catch(console.error);