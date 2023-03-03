const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 80;
const upload = multer();

app.post('/upload', upload.any(), async (req, res) => {
  try {
    // Resize the image to 32x32 pixels to reduce processing time
    const imageBuffer = await sharp(req.files[0].buffer).resize(32, 32).toBuffer();
    res.json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.post('/search', upload.any(), async (req, res) => {
  try {
    // Resize the image to 32x32 pixels to reduce processing time
    const imageBuffer = await sharp(req.files[0].buffer).resize(32, 32).toBuffer();

    // Use Google's reverse image search service to find similar images
    const searchResponse = await axios.post('https://www.google.com/searchbyimage/upload', imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });

    // Extract the "best guess" URL from the search results page
    const $ = cheerio.load(searchResponse.data);
    const bestGuessUrl = $('a.iUh30').first().attr('href');

    // Make a GET request to the best guess URL and extract the website name from the response
    const websiteResponse = await axios.get(bestGuessUrl);
    const websiteName = cheerio.load(websiteResponse.data)('title').text();

    res.json({ websiteName });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
