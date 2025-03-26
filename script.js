document.addEventListener("DOMContentLoaded", () => {
    // Slack Login
    document.getElementById("slack-login").addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default behavior
        window.location.href = "/api/slack/login"; // Redirect to Slack OAuth URL
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
            const response = await fetch(`/api/slack/messages?channel_id=${channelId}`, {
                credentials: "include",  // Ensure cookies/sessions are sent
            });

            if (!response.ok) throw new Error("Error fetching messages");
            
            const data = await response.json(); // Parse JSON instead of text

			// In the fetch-messages handler:
			if (data.messages && Array.isArray(data.messages)) {
    			// Store raw messages in data attribute
    			messagesContainer.dataset.messages = JSON.stringify(data.messages);
    
    			// Display to user
    			const messageTexts = data.messages.map(msg => 
        		`[${new Date(msg.ts * 1000).toLocaleString()}] ${msg.user || 'unknown'}: ${msg.text}`
    			).join("\n");
    
    			messagesContainer.innerText = messageTexts;
			} else {
    			document.getElementById("messages").innerText = "No messages found.";
			}

			
        } catch (error) {
            console.error(error);
            alert("Failed to fetch messages.");
        }
    });

    // Summarize Messages
    
document.getElementById("summarize").addEventListener("click", async (event) => {
    event.preventDefault();

    // Get the raw messages data from the API response
    const messagesContainer = document.getElementById("messages");
    const rawMessages = messagesContainer.dataset.messages; // New line
    
    if (!rawMessages) {
        alert("No messages to summarize. Fetch messages first!");
        return;
    }

    try {
        const response = await fetch("/api/ai/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: rawMessages // Send the original message data
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error("API Error:", data.detail);
            throw new Error(data.detail || "Summarization failed");
        }
        
        document.getElementById("summary").innerText = data.summary;
    } catch (error) {
        console.error("Summarization error:", error);
        alert(error.message);
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
        const response = await fetch("/api/calendar/event", {
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
