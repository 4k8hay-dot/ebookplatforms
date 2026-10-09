/**
 * Run with: npm run seed:catalog
 * Creates demo categories, a demo author account, and a handful of
 * 'approved' books so the Phase 2 catalog UI has real data to browse.
 * This is test/demo data ONLY, populated because the actual author
 * upload workflow (FR-AUTHOR-*) is not built until Phase 3.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Book = require('../models/Book');

const CATEGORIES = ['Fiction', 'Science', 'Technology', 'History', 'Self-Help'];

const DEMO_BOOKS = [
  { title: 'The Silent Orbit', category: 'Fiction', format: 'epub', language: 'English', year: 2019, publisher: 'Northwind Press' },
  { title: 'Principles of Modern Physics', category: 'Science', format: 'pdf', language: 'English', year: 2015, publisher: 'Academic Sky' },
  { title: 'Clean Backend Architecture', category: 'Technology', format: 'pdf', language: 'English', year: 2022, publisher: 'DevCraft Books' },
  { title: 'Empires of the Sand', category: 'History', format: 'epub', language: 'English', year: 2011, publisher: 'Heritage House' },
  { title: 'Atomic Focus', category: 'Self-Help', format: 'epub', language: 'English', year: 2021, publisher: 'Better Living Press' },
  { title: 'The Last Cartographer', category: 'Fiction', format: 'pdf', language: 'Spanish', year: 2018, publisher: 'Mapa Editorial' },
  { title: 'Introduction to Machine Learning', category: 'Technology', format: 'pdf', language: 'English', year: 2023, publisher: 'DevCraft Books' },
  { title: 'A Short History of Everything Small', category: 'Science', format: 'epub', language: 'English', year: 2020, publisher: 'Academic Sky' },
];

async function run() {
  await connectDB();

  const categoryDocs = {};
  for (const name of CATEGORIES) {
    let cat = await Category.findOne({ name });
    if (!cat) cat = await Category.create({ name });
    categoryDocs[name] = cat;
  }
  console.log(`Categories ready: ${Object.keys(categoryDocs).join(', ')}`);

  const authorEmail = 'demo.author@example.com';
  let author = await User.findOne({ email: authorEmail });
  if (!author) {
    author = new User({ name: 'Demo Author', email: authorEmail, role: 'author' });
    author.password = 'DemoAuthor123!';
    await author.save();
    console.log(`Demo author created: ${authorEmail} / DemoAuthor123!`);
  }

  for (const b of DEMO_BOOKS) {
    const exists = await Book.findOne({ title: b.title });
    if (exists) continue;
    await Book.create({
      title: b.title,
      description: `A demo catalog entry for "${b.title}", used to test browsing, search and filtering.`,
      authorId: author._id,
      category: categoryDocs[b.category]._id,
      format: b.format,
      language: b.language,
      publicationInfo: { publisher: b.publisher, year: b.year },
      status: 'approved',
    });
  }
  console.log(`Demo books ready (${DEMO_BOOKS.length} total).`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
