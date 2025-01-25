let intervalId;

self.onmessage = (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case "START_TIMER":
            // Start a timer with a specified duration
            if (intervalId) break;
            self.postMessage({
                type: "TIMER_STARTED"
            });
            startTimer(payload.id, payload.remaining_time);
            break;

        case "STOP_TIMER":
            // Stop the timer
            stopTimer();
            break;

        default:
            console.error("Unknown message type:", type);
    }
}

function startTimer(id, remaining_time) {
    if (intervalId) {
        stopTimer();
    }
    intervalId = setInterval(() => {
        remaining_time -= 1;
        if (remaining_time < 0) {
            clearInterval(intervalId);
            self.postMessage({
                type: "TIMER_COMPLETED",
                id
            });
        } else {
            self.postMessage({
                type: "TIMER_UPDATE",
                id,
                remaining_time
            })
        }

    }, 1000);
}

function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
}