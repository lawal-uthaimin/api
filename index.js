const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const https = require('https');
const cheerio = require('cheerio');

const app = express();
const port = 8080;
const upload = multer();

app.post('/search', upload.any(), async (req, res) => {
  try {
    // Resize the image to 32x32 pixels to reduce processing time
    const imageBuffer = await sharp(req.file.buffer).resize(32, 32).toBuffer();

    // Use Google's reverse image search service to find similar images
    const options = {
      method: 'POST',
      hostname: 'www.google.com',
      path: '/searchbyimage/upload',
      headers: {
        'Content-Type': 'image/jpeg',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Content-Length': imageBuffer.length
      }
    };
    const request = https.request(options, response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', async () => {
        // Extract the "best guess" URL from the search results page
        const $ = cheerio.load(data);
        const bestGuessUrl = $('a.iUh30').first().attr('href');

        // Make a GET request to the best guess URL and extract the website name from the response
        const websiteResponse = https.get(bestGuessUrl);
        const websiteName = cheerio.load(websiteResponse).text();

        res.json({ websiteName });
      });
    });
    request.write(imageBuffer);
    request.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
