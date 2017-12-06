const fs = require('fs');
const path = require('path');
const babelify = require('babelify');
const cssify = require('browserify-css');
const browserify = require('browserify');

const generalFileRegex = /(\.)(.)+/gi;
const baseDir = "./src";
const outputDir = "./public";
const entryFile = "index.jsx";

/**
 * Builds the src directory
 */
function build() {
  let directories = [];

  // Searches through the src directory and adds all subfolders to an array
  const files = fs.readdirSync(baseDir);
  for (x = 0; x < files.length; x++) {
    const file = files[x];
    // finds the subfolders (In this case anything that matches the regex /(\.)(.)+/gi)
    if (file.match(generalFileRegex) === null) {
      const dirFiles = fs.readdirSync(`${baseDir}/${file}`);
      // Looks for the entry file before adding to the directory array
      if (dirFiles.includes(entryFile)) {
        directories.push(file);
      }
    }
  }

  // Goes through each subfolder to bundle them
  // Bundles index.jsx into a js file in public named after the subfolder
  for (let i = 0; i < directories.length; i++) {
    const dirName = directories[i];
    // Nice looking log
    console.log(`${dirName}/index.jsx -> ${dirName}.js`);
    bundle(`${baseDir}/${dirName}/index.jsx`, dirName);
  }
}

/**
 * Bundles files togeather into outputName.js
 * @param {Array} files array of the file urls
 * @param {string} outputName name of the output file (.js added automatically)
 * @example
 * bundle(["./src/index/index.jsx"], "index");
 */
function bundle(files, outputName) {
  // Use babelify and browserify-css to compile react and css
  browserify()
    // Uses babelify's react and es6 presets
    .transform(babelify, {presets: ["es2015", "react"]})
    // Allows bundling of css
    .transform(cssify)
    // Adds files, Don't use .require() unless you want it to import it as a module
    .add(files)
    .bundle()
    .on('error', (err) => {
      console.log(`Error: ${err.message}`);
    })
    .pipe(fs.createWriteStream(`${outputDir}/${outputName}.js`));
}

// Run the script
build();
