const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const API_BASE = 'http://62.171.141.197:5007';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const getApiData = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: { 'x-app-version': '10' }
        });
        return response.data;
    } catch (error) {
        console.error(`API Error (${url}):`, error.message);
        return null;
    }
};

app.get('/', async (req, res) => {
    const data = await getApiData(`${API_BASE}/novels/latest?page=1&limit=30`);
    const novels = data && data.success ? data.data : [];
    res.render('index', { novels });
});

app.get('/search', async (req, res) => {
    const query = req.query.q || '';
    const data = await getApiData(`${API_BASE}/novels/search?q=${encodeURIComponent(query)}`);
    const results = Array.isArray(data) ? data : (data && data.data ? data.data : []);
    res.render('search', { results, query });
});

app.get('/novel/:id', async (req, res) => {
    const data = await getApiData(`${API_BASE}/novels/${req.params.id}`);
    if (!data || !data.success || !data.data) return res.status(404).send('الرواية غير موجودة');
    res.render('novel', { novel: data.data });
});

// Madara Ajax Chapters Emulator
app.post(['/novel/:id/ajax/chapters', '/novel/:id/ajax/chapters/'], async (req, res) => {
    const data = await getApiData(`${API_BASE}/novels/${req.params.id}`);
    if (!data || !data.success || !data.data) return res.status(404).send('');
    
    let html = '<ul class="main version-chap">';
    for(let i = 1; i <= (data.data.totalChapters || 0); i++) {
        html += `<li class="wp-manga-chapter"><a href="/novel/${req.params.id}/chapter/${i}">الفصل ${i}</a></li>`;
    }
    html += '</ul>';
    res.send(html);
});

app.get('/novel/:id/chapter/:num', async (req, res) => {
    const data = await getApiData(`${API_BASE}/novels/${req.params.id}/chapters/${req.params.num}`);
    if (!data || !data.success || !data.data) return res.status(404).send('الفصل غير موجود');
    res.render('chapter', { 
        chapter: data.data,
        novelId: req.params.id,
        chapterNum: parseInt(req.params.num)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
