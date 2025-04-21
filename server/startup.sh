
#!/bin/sh

# Print MongoDB connection information (hiding credentials)
if echo "$MONGODB_URI" | grep -q "mongodb+srv"; then
  echo "Using MongoDB Atlas connection"
else
  echo "Using local MongoDB connection: $MONGODB_URI"
fi

# Start the server
echo "Starting SmartPark Server..."
node server/server.js
