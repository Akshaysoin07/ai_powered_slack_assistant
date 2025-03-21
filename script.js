document.addEventListener("DOMContentLoaded", () => {
    // Slack Login
    document.getElementById("slack-login").addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default behavior
        window.location.href = "/slack/login"; // Redirect to Slack OAuth URL
    });

    // Fetch Slack Messages
    document.getElementById("fetch-messages").addEventListener("click", async (event) => {
        event.preventDefault(); // Prevent default behavior
        const channelId = document.getElementById("channel-id").value;
        if (!channelId) {
            alert("Please enter a Channel ID");
            return;
        }

        try {
            const response = await fetch(`/slack/messages?channel_id=${'channelId'}`, {
                credentials: "include",  // Ensure cookies/sessions are sent
            });

            if (!response.ok) throw new Error("Error fetching messages");
            
            const data = await response.text();
            document.getElementById("messages").innerText = JSON.stringify(data, null, 2);
        } catch (error) {
            console.error(error);
            alert("Failed to fetch messages.");
        }
    });

    // Summarize Messages
    document.getElementById("summarize").addEventListener("click", async (event) => {
    event.preventDefault();

    const messagesText = document.getElementById("messages").innerText;
    let messagesArray;

    try {
        const parsedData = JSON.parse(messagesText);
        messagesArray = parsedData.messages.map(msg => msg.text) || []; // Extract only text values
    } catch (error) {
        console.error("Invalid JSON format in messages:", error);
        alert("Failed to parse messages. Ensure messages are properly fetched.");
        return;
    }

    if (messagesArray.length === 0) {
        alert("No messages to summarize.");
        return;
    }

    try {
        const response = await fetch("/ai/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: messagesArray }),  // Ensure correct format
        });

        if (!response.ok) throw new Error("Error generating summary");

        const data = await response.json();
        document.getElementById("summary").innerText = data.summary;  // ✅ Extract the "summary" field properly
    } catch (error) {
        console.error(error);
        alert("Failed to summarize messages.");
    }
	});



    document.getElementById("create-event").addEventListener("click", async (event) => {
    event.preventDefault();

    const summary = document.getElementById("event-summary").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;

    if (!summary || !startTime || !endTime) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const response = await fetch("/calendar/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                summary: summary,
                start_time: new Date(startTime).toISOString(),  // Ensures proper format
                end_time: new Date(endTime).toISOString(),
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Error creating event");

        document.getElementById("event-status").innerText = "Event Created Successfully!";
    } catch (error) {
        console.error(error);
        document.getElementById("event-status").innerText = "Failed: " + error.message;
    }
	});
});