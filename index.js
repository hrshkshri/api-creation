const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const url = "mongodb://localhost:27017"; // Replace with your MongoDB server URL
const dbName = "database"; // Replace with your database name

MongoClient.connect(url, (err, client) => {
  if (err) {
    console.error("Failed to connect to MongoDB:", err);
    return;
  }

  const db = client.db(dbName);
  console.log("Connected to MongoDB");

  // GET /api/v3/app/events/:id - Get event by ID
  app.get("/api/v3/app/events/:id", (req, res) => {
    const eventId = req.params.id;

    db.collection("events").findOne(
      { _id: ObjectId(eventId) },
      (err, event) => {
        if (err) {
          console.error("Failed to retrieve event:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (!event) {
          res.status(404).send("Event not found");
          return;
        }

        res.status(200).json(event);
      }
    );
  });

  // GET /api/v3/app/events - Get paginated list of events
  app.get("/api/v3/app/events", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    db.collection("events")
      .find()
      .sort({ schedule: -1 }) // Sort events by recency (descending order of schedule)
      .skip(skip)
      .limit(limit)
      .toArray((err, events) => {
        if (err) {
          console.error("Failed to retrieve events:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        res.status(200).json(events);
      });
  });

  // POST /api/v3/app/events - Create event
  app.post("/api/v3/app/events", (req, res) => {
    const event = req.body; // Assuming you have the event details in the request body

    db.collection("events").insertOne(event, (err, result) => {
      if (err) {
        console.error("Failed to create event:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      const createdEventId = result.insertedId;
      res.status(201).json({ eventId: createdEventId });
    });
  });

  // PUT /api/v3/app/events/:id - Update event by ID
  app.put("/api/v3/app/events/:id", (req, res) => {
    const eventId = req.params.id;
    const updatedEvent = req.body; // Assuming you have the updated event details in the request body

    db.collection("events").updateOne(
      { _id: ObjectId(eventId) },
      { $set: updatedEvent },
      (err, result) => {
        if (err) {
          console.error("Failed to update event:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (result.matchedCount === 0) {
          res.status(404).send("Event not found");
          return;
        }

        res.status(204).send();
      }
    );
  });

  // DELETE /api/v3/app/events/:id - Delete event by ID
  app.delete("/api/v3/app/events/:id", (req, res) => {
    const eventId = req.params.id;

    db.collection("events").deleteOne(
      { _id: ObjectId(eventId) },
      (err, result) => {
        if (err) {
          console.error("Failed to delete event:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (result.deletedCount === 0) {
          res.status(404).send("Event not found");
          return;
        }

        res.status(204).send();
      }
    );
  });

  // Start the server
  app.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
});
