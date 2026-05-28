const csvtojson = require('csvtojson');
const fs = require('fs');
const path = require('path');

// Define your CSV files and their output names
const files = [
  { input: 'data/mens.csv', output: 'json/mens.json' },
  { input: 'data/womens.csv', output: 'json/womens.json' }
];

async function convertCsvToJson(inputPath, outputPath) {
  try {
    if (!fs.existsSync(inputPath)) {
      console.log(`${inputPath} not found, skipping...`);
      return false;
    }
    
    const jsonArray = await csvtojson().fromFile(inputPath);
    fs.writeFileSync(outputPath, JSON.stringify(jsonArray, null, 2));
    console.log(`Converted: ${inputPath} → ${outputPath} (${jsonArray.length} rows)`);
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Ensuring JSON directory exists...');
  if (!fs.existsSync('json')) {
    fs.mkdirSync('json');
  }
  
  console.log('Converting CSV files to JSON...\n');
  
  for (const file of files) {
    await convertCsvToJson(file.input, file.output);
  }
  
  console.log('\nConversion complete!');
}

main();
