const fs = require('fs-extra');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const ebooksDir = path.join(__dirname, '..', '..', '..', 'E-Book');
const booksFile = path.join(__dirname, '..', 'data', 'books.json');

async function uploadBook(book) {
  const filePath = path.join(ebooksDir, book.pdfFile);
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    public_id: `pojok-baca/${book.id_buku}-${path.parse(book.pdfFile).name}`,
    overwrite: true,
    use_filename: false
  });
  return { ...book, pdfUrl: result.secure_url };
}

async function main() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('CLOUDINARY_URL belum tersedia');
  }

  const books = await fs.readJson(booksFile);
  const updated = [];

  for (const book of books) {
    process.stdout.write(`\rUploading ${book.id_buku}/${books.length}: ${book.judul}`);
    updated.push(await uploadBook(book));
  }

  await fs.writeJson(booksFile, updated, { spaces: 2 });
  console.log(`\nUploaded ${updated.length} PDFs and saved URLs`);
}

main().catch(error => {
  console.error('\nUpload failed:', error.message);
  process.exitCode = 1;
});
