/**
 * Script to generate 5000 rows of dirty sales data for testing
 */

const fs = require('fs');
const path = require('path');

// Sample data pools
const customers = [
  'John Smith',
  'Mary Johnson',
  'Bob Wilson',
  'Alice Brown',
  'Charlie Davis',
  'Diana Evans',
  'Edward Frank',
  'Fiona Green',
  'George Hill',
  'Helen Ivy',
  'Ivan Jones',
  'Julia King',
  'Kevin Lee',
  'Laura Miller',
  'Mike Nelson',
  'Nancy Owen',
  'Oscar Price',
  'Penny Quinn',
  'Quinn Reed',
  'Rachel Stone',
  'Sam Turner',
  'Tina Upton',
  'Uma Vance',
  'Victor Wang',
  'Wendy Xu',
  'Xavier Young',
  'Yolanda Zane',
  'Adam Baker',
  'Betty Clark',
  'Chris Dean',
  'David Ellis',
  'Emma Foster',
  'Frank Grant',
  'Grace Harris',
  'Henry Irving',
  'Iris Jackson',
  'James Kelly',
  'Kate Lopez',
  'Leo Martin',
  'Mia Nguyen',
];

const products = [
  'Laptop',
  'Phone',
  'Tablet',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headphones',
  'Webcam',
  'Speaker',
  'Printer',
  'Router',
  'SSD Drive',
  'USB Hub',
  'Power Bank',
  'Smart Watch',
];

const regions = ['North', 'South', 'East', 'West', 'Central'];

const prices = {
  Laptop: 999.99,
  Phone: 699.0,
  Tablet: 449.99,
  Monitor: 299.99,
  Keyboard: 79.99,
  Mouse: 29.99,
  Headphones: 149.99,
  Webcam: 89.99,
  Speaker: 199.99,
  Printer: 249.99,
  Router: 129.99,
  'SSD Drive': 119.99,
  'USB Hub': 39.99,
  'Power Bank': 49.99,
  'Smart Watch': 299.99,
};

// Helper functions
function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Dirty data generators
function applyWhitespaceIssue(str) {
  const issues = [
    s => `  ${s}  `, // Leading and trailing spaces
    s => `   ${s}`, // Leading spaces only
    s => `${s}   `, // Trailing spaces only
    s => s.replace(' ', '  '), // Double space in middle
    s => `\t${s}`, // Tab character
  ];
  return randomChoice(issues)(str);
}

function applyCaseIssue(str) {
  const issues = [
    s => s.toLowerCase(),
    s => s.toUpperCase(),
    s => s.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()), // Title case
    s =>
      s
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join(''),
  ];
  return randomChoice(issues)(str);
}

// Generate rows
const rows = [];
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

// Store some rows for duplication later
const rowsForDuplication = [];

for (let i = 0; i < 5000; i++) {
  const date = randomDate(startDate, endDate);
  let customer = randomChoice(customers);
  let product = randomChoice(products);
  let quantity = randomInt(1, 20);
  const unitPrice = prices[product];
  let total = (quantity * unitPrice).toFixed(2);
  let region = randomChoice(regions);

  // Apply dirty data with various probabilities
  const rand = Math.random();

  // ~5% Duplicate rows
  if (rand < 0.05 && rowsForDuplication.length > 0) {
    const dupRow = randomChoice(rowsForDuplication);
    rows.push(dupRow);
    continue;
  }

  // ~3% Completely empty rows
  if (rand < 0.03) {
    rows.push([date, '', '', '', '', '', '']);
    continue;
  }

  // ~5% Missing customer
  if (rand < 0.08) {
    customer = '';
  }

  // ~5% Missing quantity and total
  if (rand > 0.92) {
    quantity = '';
    total = '';
  }

  // ~4% Missing region
  if (rand > 0.96) {
    region = '';
  }

  // ~3% Missing product
  if (rand > 0.97) {
    product = '';
  }

  // ~10% Whitespace issues in customer
  if (Math.random() < 0.1 && customer) {
    customer = applyWhitespaceIssue(customer);
  }

  // ~8% Case issues in customer
  if (Math.random() < 0.08 && customer) {
    customer = applyCaseIssue(customer);
  }

  // ~10% Whitespace issues in product
  if (Math.random() < 0.1 && product) {
    product = applyWhitespaceIssue(product);
  }

  // ~12% Case issues in product
  if (Math.random() < 0.12 && product) {
    product = applyCaseIssue(product);
  }

  // ~15% Case issues in region
  if (Math.random() < 0.15 && region) {
    region = applyCaseIssue(region);
  }

  // ~5% Whitespace issues in region
  if (Math.random() < 0.05 && region) {
    region = applyWhitespaceIssue(region);
  }

  const row = [date, customer, product, quantity, unitPrice, total, region];
  rows.push(row);

  // Store some clean rows for duplication (every 50th row)
  if (i % 50 === 0 && customer && product && quantity && region) {
    rowsForDuplication.push([
      date,
      customer,
      product,
      quantity,
      unitPrice,
      (quantity * unitPrice).toFixed(2),
      region,
    ]);
  }
}

// Add header and convert to CSV
const header = 'Date,Customer,Product,Quantity,Unit Price,Total,Region';
const csvContent = [header, ...rows.map(row => row.join(','))].join('\n');

// Write to file
const outputPath = path.join(__dirname, 'sample-dirty-data-5000.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`✅ Generated ${rows.length} rows of dirty data!`);
console.log(`📂 File saved to: ${outputPath}`);
console.log('\n📊 Dirty data statistics (approximate):');
console.log('  - Duplicate rows: ~250 (5%)');
console.log('  - Empty rows: ~150 (3%)');
console.log('  - Missing customer: ~250');
console.log('  - Missing quantity/total: ~400');
console.log('  - Missing region: ~200');
console.log('  - Whitespace issues: ~1000+');
console.log('  - Case inconsistencies: ~1500+');
