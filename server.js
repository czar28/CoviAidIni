const express = require('express');
const connectDB = require('./config/db');
const app = express();

const PORT = process.env.PORT || 5000;
//Connect Database
connectDB();

//Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API running'));

//Routes -
app.use('/api/users', require('./routes/api/users'));

app.use('/api/resources', require('./routes/api/resources'));

app.use('/api/auth', require('./routes/api/auth'));

app.use('/api/blogs', require('./routes/api/blogs'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
