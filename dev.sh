#!/usr/bin/env bash
# Start Lymoon frontend (Expo) and backend (.NET API) concurrently

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Lymoon dev environment..."

# Start backend
(cd "$ROOT/Lymoon.API" && dotnet run) &
BACKEND_PID=$!

# Start frontend
(cd "$ROOT/lymoon-mobile" && npm start) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers."

# Kill both on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup INT TERM

wait
