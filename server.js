const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./config/db');

const app = express();
app.use(cors());

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

app.get('/', (req, res) => {
  res.json({ message: 'TenderPool API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));