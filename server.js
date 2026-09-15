require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');

const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/live-polling-app';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- REST API ----------

// Create a new poll
app.post('/api/polls', async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'A question and at least two options are required.' });
    }

    const poll = await Poll.create({
      question,
      options: options.map((text) => ({ text, votes: 0 }))
    });

    res.status(201).json(poll);
  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(500).json({ error: 'Failed to create poll.' });
  }
});

// Fetch a single poll by id
app.get('/api/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found.' });
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    res.status(500).json({ error: 'Failed to fetch poll.' });
  }
});

// List recent polls
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 }).limit(20);
    res.json(polls);
  } catch (err) {
    console.error('Error listing polls:', err);
    res.status(500).json({ error: 'Failed to list polls.' });
  }
});

// Cast a vote
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ error: 'Poll not found.' });
    if (
      typeof optionIndex !== 'number' ||
      optionIndex < 0 ||
      optionIndex >= poll.options.length
    ) {
      return res.status(400).json({ error: 'Invalid option index.' });
    }

    poll.options[optionIndex].votes += 1;
    await poll.save();

    // Broadcast the updated results to everyone viewing this poll
    io.to(poll._id.toString()).emit('pollUpdated', poll);

    res.json(poll);
  } catch (err) {
    console.error('Error casting vote:', err);
    res.status(500).json({ error: 'Failed to cast vote.' });
  }
});

// ---------- Socket.io ----------

io.on('connection', (socket) => {
  // Clients join a "room" named after the poll id they're viewing,
  // so vote updates only broadcast to people looking at that poll.
  socket.on('joinPoll', (pollId) => {
    socket.join(pollId);
  });

  socket.on('leavePoll', (pollId) => {
    socket.leave(pollId);
  });
});

// ---------- Startup ----------

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
